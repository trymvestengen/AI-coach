TOOL_DEFINITIONS = [
    {
        "name": "get_exercise_info",
        "description": "Get details about a specific exercise by ID. Returns muscle groups, equipment, difficulty, and instructions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {
                    "type": "string",
                    "description": "The exercise ID, e.g. 'bench-press', 'squat', 'deadlift'",
                }
            },
            "required": ["exercise_id"],
        },
    },
    {
        "name": "search_exercises",
        "description": "Search exercises by muscle group, equipment, or difficulty. Use this before recommending exercises to ensure they exist.",
        "input_schema": {
            "type": "object",
            "properties": {
                "muscle_group": {
                    "type": "string",
                    "description": "Filter by muscle group, e.g. 'chest', 'back', 'quads', 'biceps'",
                },
                "equipment": {
                    "type": "string",
                    "description": "Filter by equipment, e.g. 'barbell', 'dumbbell', 'bodyweight', 'cable machine'",
                },
                "difficulty": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                    "description": "Filter by difficulty level",
                },
            },
        },
    },
    {
        "name": "create_template",
        "description": "Create and save a workout template to the database. Call this when the user asks for a training plan or workout template.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the template, e.g. 'Pull A', 'Full body styrke'",
                },
                "exercises": {
                    "type": "array",
                    "description": "List of exercises in this template.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "exercise_id": {
                                "type": "string",
                                "description": "Exercise ID from the exercise library, e.g. 'squat', 'bench-press'",
                            },
                            "sets": {"type": "integer", "minimum": 1, "maximum": 50, "description": "Number of sets (creates N template_exercise_sets rows, max 50)"},
                            "reps": {"type": "integer"},
                            "weight_kg": {
                                "type": "number",
                                "description": "Starting weight in kg (optional)",
                            },
                        },
                        "required": ["exercise_id", "sets", "reps"],
                    },
                },
            },
            "required": ["name"],
        },
    },
    {
        "name": "log_workout",
        "description": "Log a completed workout session with exercises, sets, reps, and weight. Call this when the user has finished training or wants to record what they did.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercises": {
                    "type": "array",
                    "description": "List of exercises done in this session",
                    "items": {
                        "type": "object",
                        "properties": {
                            "exercise_id": {"type": "string", "description": "Exercise ID, e.g. 'squat', 'bench-press'"},
                            "sets": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "reps": {"type": "integer"},
                                        "weight_kg": {"type": "number"},
                                        "rpe": {"type": "integer", "minimum": 1, "maximum": 10},
                                        "coach_note": {
                                            "type": "string",
                                            "description": "Short note about this set (quality, feel).",
                                        },
                                    },
                                    "required": ["reps"],
                                },
                            },
                        },
                        "required": ["exercise_id", "sets"],
                    },
                },
                "notes": {"type": "string", "description": "Optional notes about the session"},
                "rpe": {"type": "integer", "minimum": 1, "maximum": 10, "description": "Overall session RPE (1-10)"},
                "coach_summary": {
                    "type": "string",
                    "description": "Overall coach summary of the workout (optional).",
                },
            },
            "required": ["exercises"],
        },
    },
    {
        "name": "get_user_history",
        "description": "Get the user's recent workout history. Use this to see what they've done before giving advice or checking progress.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Number of recent workouts to fetch (default 5)", "default": 5},
            },
        },
    },
    {
        "name": "suggest_progression",
        "description": "Suggest the weight to use for a specific exercise based on the user's recent RPE. Returns a concrete recommendation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {"type": "string", "description": "Exercise ID, e.g. 'squat', 'bench-press'"},
            },
            "required": ["exercise_id"],
        },
    },
    {
        "name": "get_user_profile",
        "description": "Get the user's full profile: name, locale, persona mode, goals, active injuries, preferences, available equipment, and constraints. Call this when you need user-stated facts (e.g. before designing a program or addressing pain).",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "get_workout_history",
        "description": "Return the user's recent workouts including all sets and any coach notes/summaries. Optionally filter by exercise_id to see history for a specific lift.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {
                    "type": "string",
                    "description": "Optional. Filter to workouts containing this exercise.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max number of workouts to return (default 10).",
                },
            },
        },
    },
    {
        "name": "get_progression",
        "description": "Return weekly aggregates (max weight, total volume, avg RPE, set count) for a specific exercise over the last N weeks. Use this when the user asks about progress on a lift.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {"type": "string", "description": "Exercise ID, e.g. 'squat', 'bench-press'"},
                "weeks": {"type": "integer", "description": "Lookback window in weeks (default 12)."},
            },
            "required": ["exercise_id"],
        },
    },
    {
        "name": "search_observations",
        "description": "Search coach observations about the user. Filter by category (pattern, injury_hint, preference_hint, energy_level, form_issue, milestone, other) and time window. Use this to recall things you noticed before.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Optional category filter."},
                "days": {"type": "integer", "description": "Lookback window in days (default 90)."},
                "limit": {"type": "integer", "description": "Max results (default 20)."},
            },
        },
    },
    {
        "name": "get_recent_sessions",
        "description": "Return summaries of recent coach conversation sessions with the user. Use to recall what was discussed in past conversations.",
        "input_schema": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Lookback window in days (default 30)."},
                "limit": {"type": "integer", "description": "Max results (default 10)."},
            },
        },
    },
    {
        "name": "write_observation",
        "description": "Record an observation about the user. Use this when you notice a pattern, possible injury, preference, energy trend, form issue, or milestone worth remembering. Will be available in future conversations via search_observations.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["pattern", "injury_hint", "preference_hint", "energy_level", "form_issue", "milestone", "other"],
                    "description": "Type of observation.",
                },
                "observation": {
                    "type": "string",
                    "description": "Free-text observation. Keep it short and specific.",
                },
                "confidence": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "How confident are you in this observation? (default medium)",
                },
                "related_workout_id": {
                    "type": "string",
                    "description": "Optional. The workout this observation arose from.",
                },
            },
            "required": ["category", "observation"],
        },
    },
    {
        "name": "log_set_with_note",
        "description": "Log a single set during an active workout, including an optional coach note about quality, feel, or form. Use this when the user describes a set verbally and you log it for them.",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string", "description": "The active workout's id."},
                "exercise_id": {"type": "string", "description": "Exercise id, e.g. 'squat'."},
                "set_number": {"type": "integer", "minimum": 1, "description": "Set number within the exercise (1-based)."},
                "reps": {"type": "integer", "description": "Reps completed (nullable)."},
                "weight_kg": {"type": "number", "description": "Weight used in kg (nullable for bodyweight)."},
                "rpe": {"type": "integer", "description": "RPE 1-10 (optional)."},
                "coach_note": {"type": "string", "description": "Short note: quality, feel, form observation."},
            },
            "required": ["workout_id", "exercise_id", "set_number"],
        },
    },
    {
        "name": "update_template",
        "description": "Update an existing workout template. Can change name or move to a folder.",
        "input_schema": {
            "type": "object",
            "properties": {
                "template_id": {"type": "string", "description": "Template ID to update."},
                "name": {"type": "string", "description": "Optional new name."},
                "folder_id": {"type": ["string", "null"], "description": "Optional. Folder UUID to move into, or null to move to root."},
            },
            "required": ["template_id"],
        },
    },
    {
        "name": "delete_template",
        "description": "Permanently delete a workout template. CONFIRM-PLIKTIG — see CONFIRM-REGEL in your system prompt before calling.",
        "input_schema": {
            "type": "object",
            "properties": {
                "template_id": {"type": "string", "description": "Template ID to delete."},
            },
            "required": ["template_id"],
        },
    },
    {
        "name": "add_exercise_to_template",
        "description": "Add an exercise to a workout template.",
        "input_schema": {
            "type": "object",
            "properties": {
                "template_id": {"type": "string"},
                "exercise_id": {"type": "string", "description": "Exercise ID from the library."},
                "sets": {"type": "integer", "minimum": 1, "maximum": 50},
                "reps": {"type": "integer"},
                "weight_kg": {"type": "number"},
            },
            "required": ["template_id", "exercise_id", "sets", "reps"],
        },
    },
    {
        "name": "remove_exercise_from_template",
        "description": "Remove an exercise from a workout template. CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {
                "template_id": {"type": "string"},
                "exercise_id": {"type": "string", "description": "Exercise ID (text) to remove."},
            },
            "required": ["template_id", "exercise_id"],
        },
    },
    {
        "name": "swap_exercise_in_template",
        "description": "Replace one exercise in a workout template with another. CONFIRM-PLIKTIG — set data for the old exercise is lost.",
        "input_schema": {
            "type": "object",
            "properties": {
                "template_id": {"type": "string"},
                "old_exercise_id": {"type": "string"},
                "new_exercise_id": {"type": "string"},
            },
            "required": ["template_id", "old_exercise_id", "new_exercise_id"],
        },
    },
    {
        "name": "update_exercise_sets",
        "description": "Update sets, reps, or weight for an exercise in a workout template.",
        "input_schema": {
            "type": "object",
            "properties": {
                "template_id": {"type": "string"},
                "exercise_id": {"type": "string"},
                "sets": {"type": "integer", "minimum": 1, "maximum": 50},
                "reps": {"type": "integer"},
                "weight_kg": {"type": "number"},
            },
            "required": ["template_id", "exercise_id"],
        },
    },
    {
        "name": "create_folder",
        "description": "Create a new folder for organizing workout templates.",
        "input_schema": {
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        },
    },
    {
        "name": "rename_folder",
        "description": "Rename an existing folder.",
        "input_schema": {
            "type": "object",
            "properties": {
                "folder_id": {"type": "string"},
                "name": {"type": "string"},
            },
            "required": ["folder_id", "name"],
        },
    },
    {
        "name": "delete_folder",
        "description": "Delete a folder. Templates in the folder are moved to root (not deleted). CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {"folder_id": {"type": "string"}},
            "required": ["folder_id"],
        },
    },
    {
        "name": "list_folders",
        "description": "List all folders the user has, with template counts.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "start_workout_from_template",
        "description": "Start a workout based on a workout template. Returns the workout_id so subsequent log_set calls can attach.",
        "input_schema": {
            "type": "object",
            "properties": {"template_id": {"type": "string"}},
            "required": ["template_id"],
        },
    },
    {
        "name": "complete_workout",
        "description": "Mark a workout as complete.",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string"},
                "rpe": {"type": "integer", "minimum": 1, "maximum": 10},
                "notes": {"type": "string"},
            },
            "required": ["workout_id"],
        },
    },
    {
        "name": "discard_workout",
        "description": "Permanently delete a workout (in-progress or completed). CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {"workout_id": {"type": "string"}},
            "required": ["workout_id"],
        },
    },
    {
        "name": "swap_active_workout_exercise",
        "description": "During an active workout, swap one exercise for another. Logs go forward under the new exercise.",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string"},
                "old_exercise_id": {"type": "string"},
                "new_exercise_id": {"type": "string"},
            },
            "required": ["workout_id", "old_exercise_id", "new_exercise_id"],
        },
    },
    {
        "name": "add_active_workout_exercise",
        "description": "Add a bonus exercise to an in-progress workout (not part of the program day).",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string"},
                "exercise_id": {"type": "string"},
            },
            "required": ["workout_id", "exercise_id"],
        },
    },
    {
        "name": "update_user_profile",
        "description": "Update the user's profile fields. Only include fields that should change.",
        "input_schema": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "goals": {"type": "array", "items": {"type": "string"}},
                "experience_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
                "training_days_per_week": {"type": "integer"},
                "height_cm": {"type": "integer"},
                "weight_kg": {"type": "number"},
                "activity_level": {"type": "string"},
                "years_training": {"type": "integer"},
                "preferred_training_time": {"type": "string"},
                "max_session_duration_min": {"type": "integer"},
            },
        },
    },
    {
        "name": "set_persona_mode",
        "description": "Change the coach's personality mode.",
        "input_schema": {
            "type": "object",
            "properties": {
                "mode": {"type": "string", "enum": ["friend", "sergeant", "analyst"]},
            },
            "required": ["mode"],
        },
    },
    {
        "name": "add_injury",
        "description": "Record a new injury the user has mentioned.",
        "input_schema": {
            "type": "object",
            "properties": {
                "body_part": {"type": "string"},
                "description": {"type": "string"},
                "severity": {"type": "string", "enum": ["low", "moderate", "high"]},
                "started_at": {"type": "string", "description": "ISO date YYYY-MM-DD."},
            },
            "required": ["body_part"],
        },
    },
    {
        "name": "update_injury",
        "description": "Update an existing injury — change severity, description, or active status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "injury_id": {"type": "string"},
                "severity": {"type": "string", "enum": ["low", "moderate", "high"]},
                "description": {"type": "string"},
                "is_active": {"type": "boolean"},
            },
            "required": ["injury_id"],
        },
    },
    {
        "name": "remove_injury",
        "description": "Mark an injury as healed (sets is_active=false). CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {"injury_id": {"type": "string"}},
            "required": ["injury_id"],
        },
    },
    {
        "name": "add_equipment",
        "description": "Record equipment the user has available.",
        "input_schema": {
            "type": "object",
            "properties": {"equipment": {"type": "string"}},
            "required": ["equipment"],
        },
    },
    {
        "name": "remove_equipment",
        "description": "Remove a piece of equipment from the user's available list.",
        "input_schema": {
            "type": "object",
            "properties": {"equipment": {"type": "string"}},
            "required": ["equipment"],
        },
    },
    {
        "name": "add_preference",
        "description": "Record a user preference (e.g. 'kort økt', 'liker compound').",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string"},
                "preference": {"type": "string"},
            },
            "required": ["category", "preference"],
        },
    },
    {
        "name": "remove_preference",
        "description": "Remove a preference by ID.",
        "input_schema": {
            "type": "object",
            "properties": {"preference_id": {"type": "string"}},
            "required": ["preference_id"],
        },
    },
    {
        "name": "add_constraint",
        "description": "Record a constraint (e.g. 'time': '30 min/dag').",
        "input_schema": {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "description": {"type": "string"},
            },
            "required": ["type", "description"],
        },
    },
    {
        "name": "remove_constraint",
        "description": "Remove a constraint by ID.",
        "input_schema": {
            "type": "object",
            "properties": {"constraint_id": {"type": "string"}},
            "required": ["constraint_id"],
        },
    },
    {
        "name": "share_workout",
        "description": "Share a completed workout to the social feed.",
        "input_schema": {
            "type": "object",
            "properties": {"workout_id": {"type": "string"}},
            "required": ["workout_id"],
        },
    },
    {
        "name": "log_body_metric",
        "description": "Log a body measurement (weight in kg and/or body fat %). Call this when the user reports their weight or body fat, e.g. 'jeg veier 82 kg nå' or 'BF har gått ned til 18%'. At least one of weight_kg or body_fat_pct must be given.",
        "input_schema": {
            "type": "object",
            "properties": {
                "weight_kg": {"type": "number", "description": "Body weight in kg (optional)"},
                "body_fat_pct": {"type": "number", "description": "Body fat percentage (optional)"},
                "notes": {"type": "string", "description": "Optional context, e.g. 'morgenvekt'"},
            },
        },
    },
    {
        "name": "get_body_metrics",
        "description": "Read the user's recent body measurements (weight, body fat %) to give informed nutrition/weight advice. Call this BEFORE commenting on weight goals or progress.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "How many recent measurements (default 20, max 100)"},
            },
        },
    },
    {
        "name": "get_user_stats",
        "description": "Get the user's aggregate training stats: total completed workouts, current/longest streak in days, this-week count, all-time volume in kg, and top 5 trained muscles. Use for motivation, progress checks, or to congratulate streaks.",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]
