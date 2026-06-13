import os
import pytest
from unittest.mock import patch
from db.seed_free_exercise_db import build_image_urls, build_row_params

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


def test_build_image_urls_constructs_github_raw_urls():
    sample = {"images": ["Barbell_Squat/0.jpg", "Barbell_Squat/1.jpg"]}
    urls = build_image_urls(sample)
    assert urls == [
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/1.jpg",
    ]


def test_build_image_urls_handles_missing_images():
    sample = {}
    assert build_image_urls(sample) == []


def test_build_row_params_maps_fields():
    sample = {
        "id": "Barbell_Squat",
        "name": "Barbell Squat",
        "primaryMuscles": ["quadriceps"],
        "secondaryMuscles": ["glutes", "hamstrings"],
        "equipment": "barbell",
        "level": "intermediate",
        "instructions": ["Step 1", "Step 2"],
        "force": "push",
        "mechanic": "compound",
        "category": "strength",
        "images": ["Barbell_Squat/0.jpg"],
    }
    params = build_row_params(sample)
    assert params[0] == "Barbell_Squat"
    assert params[1] == "Barbell Squat"
    assert params[2] == ["quadriceps"]  # muscle_groups (from primaryMuscles)
    assert params[3] == ["barbell"]
    assert params[4] == "intermediate"
    assert params[5] == "Step 1\n\nStep 2"
    assert params[6] == "push"
    assert params[7] == "compound"
    assert params[8] == "strength"
    assert params[9] == ["quadriceps"]
    assert params[10] == ["glutes", "hamstrings"]
    assert params[11] == [
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
    ]


def test_build_row_params_handles_empty_equipment():
    sample = {
        "id": "X",
        "name": "X",
        "primaryMuscles": [],
        "secondaryMuscles": [],
        "equipment": None,
        "level": None,
        "instructions": [],
        "force": None,
        "mechanic": None,
        "category": None,
        "images": [],
    }
    params = build_row_params(sample)
    assert params[3] == []  # equipment
    assert params[5] == ""  # instructions
