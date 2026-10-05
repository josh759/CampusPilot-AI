import os
import unittest
import uuid
from datetime import datetime, timezone
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
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Assignment, Course, User
from app.security import create_access_token

ROUTER = "app.routers.study_assistant"
URL = "/study-assistant/chat"


def configured_settings(**overrides):
    values = {"openai_api_key": "sk-test-key", "openai_model": "test-model"}
    values.update(overrides)
    return SimpleNamespace(**values)


class StudyAssistantTests(unittest.TestCase):
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
        self.alice_course = self._course(self.alice, "CS350", "Operating Systems")
        self.alice_other_course = self._course(self.alice, "MATH200", "Linear Algebra")
        self.bob_course = self._course(self.bob, "BIO101", "Secret Biology")
        self._assignment(self.alice_course, "Scheduler Lab", "in_progress")
        self._assignment(self.alice_other_course, "Matrix Homework", "not_started")
        self._assignment(self.bob_course, "Bob Private Essay", "not_started")
        self.token = create_access_token(str(self.alice.id))
        self.headers = {"Authorization": f"Bearer {self.token}"}

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

    def _assignment(self, course, title, status):
        self.db.add(
            Assignment(
                title=title,
                status=status,
                course_id=course.id,
                due_at=datetime(2026, 11, 1, 12, 0, tzinfo=timezone.utc),
            )
        )
        self.db.commit()

    def _post(self, payload, settings=None, create=None):
        with patch(f"{ROUTER}.get_settings", return_value=settings or configured_settings()), \
                patch(f"{ROUTER}.AsyncOpenAI") as openai_cls:
            client = openai_cls.return_value
            if create is not None:
                client.responses.create.side_effect = create
            else:
                client.responses.create = AsyncMock(return_value=MagicMock(output_text="Study tip"))
            response = self.client.post(URL, json=payload, headers=self.headers)
        return response, openai_cls

    def test_requires_authentication(self):
        response = self.client.post(URL, json={"message": "hi"})
        self.assertEqual(response.status_code, 401)

    def test_successful_response_without_course(self):
        response, openai_cls = self._post({"message": "Explain deadlock"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"answer": "Study tip", "course_id": None})
        kwargs = openai_cls.return_value.responses.create.call_args.kwargs
        self.assertEqual(kwargs["model"], "test-model")
        self.assertEqual(openai_cls.call_args.kwargs["api_key"], "sk-test-key")
        self.assertIn("No course is selected", kwargs["input"])
        self.assertIn("Explain deadlock", kwargs["input"])
        self.assertNotIn("Scheduler Lab", kwargs["input"])

    def test_successful_response_with_course(self):
        response, _ = self._post(
            {"message": "Quiz prep", "course_id": str(self.alice_course.id)}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["course_id"], str(self.alice_course.id))

    def test_unowned_or_missing_course_returns_404(self):
        for course_id in (self.bob_course.id, uuid.uuid4()):
            response, openai_cls = self._post(
                {"message": "Help", "course_id": str(course_id)}
            )
            self.assertEqual(response.status_code, 404)
            openai_cls.return_value.responses.create.assert_not_called()

    def test_context_is_scoped_to_selected_course(self):
        _, openai_cls = self._post(
            {"message": "Quiz prep", "course_id": str(self.alice_course.id)}
        )
        kwargs = openai_cls.return_value.responses.create.call_args.kwargs
        sent = kwargs["instructions"] + kwargs["input"]
        self.assertIn("CS350", sent)
        self.assertIn("Operating Systems", sent)
        self.assertIn("Scheduler Lab", sent)
        self.assertIn("in_progress", sent)
        self.assertIn("2026-11-01", sent)
        for forbidden in (
            "MATH200",
            "Matrix Homework",
            "BIO101",
            "Secret Biology",
            "Bob Private",
            "alice@example.com",
            "bob@example.com",
            "Alice Secret",
            "hashed-secret",
            self.token,
        ):
            self.assertNotIn(forbidden, sent)

    def test_message_length_limit(self):
        response, _ = self._post({"message": "x" * 2001})
        self.assertEqual(response.status_code, 422)
        response, _ = self._post({"message": "   "})
        self.assertEqual(response.status_code, 422)

    def test_missing_configuration_returns_503(self):
        for settings in (
            configured_settings(openai_api_key=None),
            configured_settings(openai_model=None),
        ):
            response, openai_cls = self._post({"message": "Help"}, settings=settings)
            self.assertEqual(response.status_code, 503)
            openai_cls.assert_not_called()

    def test_upstream_failure_returns_502(self):
        error = APIConnectionError(request=MagicMock())
        response, _ = self._post({"message": "Help"}, create=error)
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("sk-test-key", response.text)


if __name__ == "__main__":
    unittest.main()
