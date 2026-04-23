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
        "description": "Generate a structured training program based on the user's goals and available equipment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "goal": {
                    "type": "string",
                    "description": "User's training goal, e.g. 'build muscle', 'lose weight', 'increase strength'",
                },
                "days_per_week": {
                    "type": "integer",
                    "description": "How many days per week the user wants to train",
                    "minimum": 2,
                    "maximum": 6,
                },
                "equipment": {
                    "type": "string",
                    "description": "Available equipment, e.g. 'full gym', 'home dumbbells', 'bodyweight only'",
                },
                "experience_level": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                },
            },
            "required": ["goal", "days_per_week", "equipment", "experience_level"],
        },
    },
]
