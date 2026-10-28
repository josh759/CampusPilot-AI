import os
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

for key, value in {
    "DATABASE_HOST": "localhost",
    "DATABASE_PORT": "5432",
    "DATABASE_NAME": "test",
    "DATABASE_USER": "test",
    "DATABASE_PASSWORD": "test",
    "JWT_SECRET_KEY": "test-secret-key-that-is-long-enough-for-hs256",
}.items():
    os.environ.setdefault(key, value)

from fastapi.testclient import TestClient
from openai import APIConnectionError
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Assignment, Course, StudyConversation, StudyMessage, User
from app.security import create_access_token

ROUTER = "app.routers.study_assistant"
BASE = "/study-assistant/conversations"


def configured_settings(**overrides):
    values = {"openai_api_key": "sk-test-key", "openai_model": "test-model"}
    values.update(overrides)
    return SimpleNamespace(**values)


class StudyConversationTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(engine)
        self.session_factory = sessionmaker(bind=engine, autoflush=False)
        self.db = self.session_factory()

        def override_get_db():
            session = self.session_factory()
            try:
                yield session
            finally:
                session.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        self.alice = self._user("alice@example.com", "Alice Secret")
        self.bob = self._user("bob@example.com", "Bob Private")
        self.course = self._course(self.alice, "CS350", "Operating Systems")
        self.other_course = self._course(self.alice, "MATH200", "Linear Algebra")
        self.bob_course = self._course(self.bob, "BIO101", "Secret Biology")
        self._assignment(self.course, "Scheduler Lab")
        self._assignment(self.other_course, "Matrix Homework")
        self._assignment(self.bob_course, "Bob Private Essay")
        self.token = create_access_token(str(self.alice.id))
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.bob_headers = {"Authorization": f"Bearer {create_access_token(str(self.bob.id))}"}

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()

    def _user(self, email, name):
        user = User(email=email, full_name=name, hashed_password="hashed-secret")
        self.db.add(user)
        self.db.commit()
        return user

    def _course(self, user, code, name):
        course = Course(code=code, name=name, user_id=user.id)
        self.db.add(course)
        self.db.commit()
        return course

    def _assignment(self, course, title):
        self.db.add(
            Assignment(
                title=title,
                status="in_progress",
                course_id=course.id,
                due_at=datetime(2026, 11, 1, 12, 0, tzinfo=timezone.utc),
            )
        )
        self.db.commit()

    def _conversation(self, user, course=None, title="New study conversation", updated_at=None):
        conversation = StudyConversation(
            user_id=user.id,
            course_id=course.id if course else None,
            title=title,
        )
        if updated_at:
            conversation.updated_at = updated_at
        self.db.add(conversation)
        self.db.commit()
        return conversation

    def _seed_messages(self, conversation, count):
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        for index in range(count):
            self.db.add(
                StudyMessage(
                    conversation_id=conversation.id,
                    role="user" if index % 2 == 0 else "assistant",
                    content=f"m{index}",
                    created_at=base + timedelta(minutes=index),
                )
            )
        self.db.commit()

    def _send(self, conversation_id, text="Explain deadlock", settings=None, create=None, headers=None):
        with patch(f"{ROUTER}.get_settings", return_value=settings or configured_settings()), \
                patch(f"{ROUTER}.AsyncOpenAI") as openai_cls:
            client = openai_cls.return_value
            if create is not None:
                client.responses.create.side_effect = create
            else:
                client.responses.create = AsyncMock(return_value=MagicMock(output_text="Tutor answer"))
            response = self.client.post(
                f"{BASE}/{conversation_id}/messages",
                json={"message": text},
                headers=headers or self.headers,
            )
        return response, openai_cls

    def _count(self, model):
        return self.db.scalar(select(func.count()).select_from(model))

    def test_authentication_required(self):
        cid = uuid.uuid4()
        calls = [
            self.client.get(BASE),
            self.client.post(BASE, json={}),
            self.client.get(f"{BASE}/{cid}"),
            self.client.delete(f"{BASE}/{cid}"),
            self.client.post(f"{BASE}/{cid}/messages", json={"message": "hi"}),
        ]
        for response in calls:
            self.assertEqual(response.status_code, 401)

    def test_create_conversation_defaults_and_custom_title(self):
        response = self.client.post(BASE, json={}, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["title"], "New study conversation")
        self.assertIsNone(body["course_id"])
        response = self.client.post(
            BASE,
            json={"title": "  Exam   prep ", "course_id": str(self.course.id)},
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["title"], "Exam prep")
        self.assertEqual(response.json()["course_id"], str(self.course.id))

    def test_create_rejects_unowned_or_missing_course_and_long_title(self):
        for course_id in (self.bob_course.id, uuid.uuid4()):
            response = self.client.post(BASE, json={"course_id": str(course_id)}, headers=self.headers)
            self.assertEqual(response.status_code, 404)
        response = self.client.post(BASE, json={"title": "x" * 121}, headers=self.headers)
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self._count(StudyConversation), 0)

    def test_list_is_scoped_and_sorted_by_updated_at_desc(self):
        old = self._conversation(self.alice, title="old", updated_at=datetime(2026, 1, 1, tzinfo=timezone.utc))
        new = self._conversation(self.alice, title="new", updated_at=datetime(2026, 2, 1, tzinfo=timezone.utc))
        bobs = self._conversation(self.bob, title="bob secret")
        response = self.client.get(BASE, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([c["id"] for c in response.json()], [str(new.id), str(old.id)])
        self.assertNotIn(str(bobs.id), response.text)
        self.assertEqual(
            set(response.json()[0]), {"id", "title", "course_id", "created_at", "updated_at"}
        )

    def test_get_ownership_and_message_ordering(self):
        conversation = self._conversation(self.alice)
        now = datetime(2026, 1, 1, tzinfo=timezone.utc)
        for offset, role, text in ((2, "assistant", "second"), (1, "user", "first"), (3, "user", "third")):
            self.db.add(StudyMessage(conversation_id=conversation.id, role=role, content=text,
                                     created_at=now + timedelta(minutes=offset)))
        self.db.commit()
        response = self.client.get(f"{BASE}/{conversation.id}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([m["content"] for m in response.json()["messages"]], ["first", "second", "third"])
        for headers in (self.bob_headers,):
            self.assertEqual(self.client.get(f"{BASE}/{conversation.id}", headers=headers).status_code, 404)
        self.assertEqual(self.client.get(f"{BASE}/{uuid.uuid4()}", headers=self.headers).status_code, 404)

    def test_send_message_persists_both_messages_and_updates_conversation(self):
        conversation = self._conversation(self.alice, self.course)
        before = conversation.updated_at
        response, openai_cls = self._send(conversation.id, "  Explain deadlock  ")
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["user_message"]["role"], "user")
        self.assertEqual(body["user_message"]["content"], "Explain deadlock")
        self.assertEqual(body["assistant_message"]["role"], "assistant")
        self.assertEqual(body["assistant_message"]["content"], "Tutor answer")
        self.assertEqual(self._count(StudyMessage), 2)
        kwargs = openai_cls.return_value.responses.create.call_args.kwargs
        self.assertIs(kwargs["store"], False)
        self.assertEqual(kwargs["max_output_tokens"], 1000)
        self.assertEqual(openai_cls.call_args.kwargs["timeout"], 30)
        self.assertEqual(openai_cls.call_args.kwargs["max_retries"], 1)
        detail = self.client.get(f"{BASE}/{conversation.id}", headers=self.headers).json()
        self.assertEqual([m["role"] for m in detail["messages"]], ["user", "assistant"])
        self.db.expire_all()
        self.assertGreaterEqual(self.db.get(StudyConversation, conversation.id).updated_at.replace(tzinfo=timezone.utc),
                                before.replace(tzinfo=timezone.utc) if before.tzinfo is None else before)

    def test_first_message_sets_title_only_when_default(self):
        default = self._conversation(self.alice)
        custom = self._conversation(self.alice, title="My title")
        long_text = "Line one\n\x07" + "a" * 300
        response, _ = self._send(default.id, long_text)
        title = response.json()["conversation"]["title"]
        self.assertLessEqual(len(title), 120)
        self.assertTrue(title.startswith("Line one a"))
        self.assertNotIn("\n", title)
        self.assertNotIn("\x07", title)
        response, _ = self._send(custom.id, "Something else")
        self.assertEqual(response.json()["conversation"]["title"], "My title")
        # A later message does not retitle the conversation.
        response, _ = self._send(default.id, "Follow up")
        self.assertEqual(response.json()["conversation"]["title"], title)

    def test_only_recent_twelve_messages_are_sent(self):
        conversation = self._conversation(self.alice)
        self._seed_messages(conversation, 20)
        _, openai_cls = self._send(conversation.id, "newest question")
        sent = openai_cls.return_value.responses.create.call_args.kwargs["input"]
        contents = [item["content"] for item in sent]
        history = [c for c in contents if c.startswith("m")]
        self.assertEqual(history, [f"m{i}" for i in range(8, 20)])
        self.assertEqual(contents[-1], "newest question")
        self.assertEqual(sent[-1]["role"], "user")
        self.assertEqual(len(sent), 14)  # context + 12 history + new message

    def test_course_and_assignment_scoping(self):
        conversation = self._conversation(self.alice, self.course)
        _, openai_cls = self._send(conversation.id)
        kwargs = openai_cls.return_value.responses.create.call_args.kwargs
        sent = kwargs["instructions"] + str(kwargs["input"])
        for expected in ("CS350", "Operating Systems", "Scheduler Lab", "untrusted data"):
            self.assertIn(expected, sent)
        for forbidden in ("MATH200", "Matrix Homework", "BIO101", "Secret Biology", "Bob Private",
                          "alice@example.com", "bob@example.com", "Alice Secret", "hashed-secret", self.token):
            self.assertNotIn(forbidden, sent)

    def test_conversation_without_course_sends_no_course_data(self):
        conversation = self._conversation(self.alice)
        _, openai_cls = self._send(conversation.id)
        sent = str(openai_cls.return_value.responses.create.call_args.kwargs["input"])
        self.assertIn("No course is selected", sent)
        self.assertNotIn("Scheduler Lab", sent)

    def test_send_message_to_unowned_or_missing_conversation_is_404_without_ai_call(self):
        bobs = self._conversation(self.bob)
        for cid in (bobs.id, uuid.uuid4()):
            response, openai_cls = self._send(cid)
            self.assertEqual(response.status_code, 404)
            openai_cls.return_value.responses.create.assert_not_called()
        self.assertEqual(self._count(StudyMessage), 0)

    def test_invalid_message_is_422(self):
        conversation = self._conversation(self.alice)
        for text in ("   ", "x" * 2001):
            response, _ = self._send(conversation.id, text)
            self.assertEqual(response.status_code, 422)

    def test_openai_failure_leaves_no_partial_data(self):
        conversation = self._conversation(self.alice)
        request = MagicMock()
        response, _ = self._send(conversation.id, "Hello", create=APIConnectionError(request=request))
        self.assertEqual(response.status_code, 502)
        self.assertEqual(self._count(StudyMessage), 0)
        self.db.expire_all()
        self.assertEqual(self.db.get(StudyConversation, conversation.id).title, "New study conversation")

    def test_empty_ai_answer_is_502_without_persistence(self):
        conversation = self._conversation(self.alice)
        response, _ = self._send(
            conversation.id, create=AsyncMock(return_value=MagicMock(output_text="  "))
        )
        self.assertEqual(response.status_code, 502)
        self.assertEqual(self._count(StudyMessage), 0)

    def test_missing_ai_configuration_is_503_without_persistence(self):
        conversation = self._conversation(self.alice)
        response, openai_cls = self._send(conversation.id, settings=configured_settings(openai_api_key=""))
        self.assertEqual(response.status_code, 503)
        openai_cls.assert_not_called()
        self.assertEqual(self._count(StudyMessage), 0)

    def test_delete_cascades_messages_and_is_owner_scoped(self):
        conversation = self._conversation(self.alice)
        deleted_id = conversation.id
        self._seed_messages(conversation, 3)
        other = self._conversation(self.bob)
        self._seed_messages(other, 2)
        self.assertEqual(self.client.delete(f"{BASE}/{other.id}", headers=self.headers).status_code, 404)
        self.assertEqual(self._count(StudyConversation), 2)
        response = self.client.delete(f"{BASE}/{conversation.id}", headers=self.headers)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        self.db.expire_all()
        self.assertEqual(self._count(StudyConversation), 1)
        self.assertEqual(self._count(StudyMessage), 2)
        self.assertEqual(self.client.get(f"{BASE}/{deleted_id}", headers=self.headers).status_code, 404)


if __name__ == "__main__":
    unittest.main()
