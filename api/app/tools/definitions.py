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
        "name": "create_program",
        "description": "Create and save a structured training program to the database. Call this when the user asks for a training plan. The new program becomes their active program.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the program, e.g. '3-dagers styrkeprogram'",
                },
                "days": {
                    "type": "array",
                    "description": "List of training days",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Day name, e.g. 'Ben', 'Overkropp', 'Helkropp'",
                            },
                            "exercises": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "exercise_id": {
                                            "type": "string",
                                            "description": "Exercise ID from the exercise library, e.g. 'squat', 'bench-press'",
                                        },
                                        "sets": {"type": "integer"},
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
                        "required": ["name", "exercises"],
                    },
                },
            },
            "required": ["name", "days"],
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
]
