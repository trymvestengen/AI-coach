# api/app/tools/onboarding_definitions.py
"""Tool definitions exposed to the coach only during onboarding mode."""

ONBOARDING_TOOL_DEFINITIONS = [
    {
        "name": "save_profile_field",
        "description": (
            "Save a single profile field. Call this AS SOON AS the user has confirmed "
            "a value. Use the exact field names listed in the schema. For multi-select "
            "fields like 'goals', pass an array of values."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "field": {
                    "type": "string",
                    "enum": [
                        "goals",
                        "experience_level",
                        "training_days_per_week",
                        "weight_kg",
                        "height_cm",
                        "birth_date",
                        "gender",
                    ],
                    "description": (
                        "goals: array of values from "
                        "['build_muscle','lose_weight','get_stronger','improve_endurance','maintain']. "
                        "experience_level: one of 'beginner','intermediate','advanced'. "
                        "training_days_per_week: integer 1-7. "
                        "weight_kg: number. height_cm: integer. "
                        "birth_date: 'YYYY-MM-DD'. "
                        "gender: one of 'male','female','other'."
                    ),
                },
                "value": {
                    "description": "Field value. Type varies by field — see field description."
                },
            },
            "required": ["field", "value"],
        },
    },
    {
        "name": "add_equipment_batch",
        "description": (
            "Add one or more equipment items the user has access to. Pass canonical "
            "strings like 'barbell','dumbbells','bench','rack','cable_machine','bodyweight'. "
            "If the user describes their setup in free text, infer the canonical items."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of equipment identifiers.",
                },
            },
            "required": ["items"],
        },
    },
    {
        "name": "set_quick_replies",
        "description": (
            "Attach quick-reply buttons to your NEXT assistant message. "
            "Use this immediately BEFORE asking a question that has a fixed set of answers. "
            "Max 5 options. The user can still type free text to override."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Button labels, max 5, in Norwegian.",
                },
            },
            "required": ["options"],
        },
    },
    {
        "name": "complete_onboarding",
        "description": (
            "Call when ALL Tier 1 fields (goals, experience_level, training_days_per_week, "
            "equipment) have been saved AND Tier 2 fields (weight_kg, height_cm, birth_date, "
            "gender) have either been saved or explicitly skipped by the user. "
            "If a Tier 1 field is missing, this will return an error telling you which."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]
