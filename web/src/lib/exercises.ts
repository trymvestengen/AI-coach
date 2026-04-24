// AUTO-GENERATED av scripts/fetch-exercises.ts — ikke rediger manuelt
// Kjør: npx tsx scripts/fetch-exercises.ts for å regenerere

export type MuscleKey =
  | "chest" | "shoulders" | "triceps" | "biceps" | "forearms"
  | "upperBack" | "lats" | "lowerBack"
  | "abs" | "glutes" | "quads" | "hamstrings" | "calves"

export interface Exercise {
  id: string
  name: string
  equipment: string
  primary: string
  secondary: string[]
  highlight: MuscleKey[]
  view: "front" | "back"
  description: string
  tips: string[]
  pr: string
  lastUsed: string
  lastWeight: string
}

export const EXERCISES: Exercise[] = [
  {
    "id": "axe-hold",
    "name": "Axe Hold",
    "equipment": "Dumbbell",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Grab dumbbells and extend arms to side and hold as long as you can",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "tricep-pushdown-on-cable",
    "name": "Tricep Pushdown on Cable",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "The cable rope push-down is a popular exercise targeting the triceps muscles. It's easy to learn and perform, making it a favorite for everyone from beginners to advanced lifters. It is usually performed for moderate to high reps, such as 8-12 reps or more per set, as part of an upper-body or arm-focused workout.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "step-ups",
    "name": "Step-ups",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand facing a chair. Steps: Step up onto the chair. Step off the chair. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "commando-pull-ups",
    "name": "commando pull-ups",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "variation of the pull-up exercise, it is performed with a grip of one hand supine and one hand prone, do not twist the torso to get back to the front, the head passes once to one side, once to the other.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-arm-plank-to-row",
    "name": "Single Arm Plank to Row",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Start position as row, extend to plank and back. Finish with row and repeat",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "fingerboard-20-mm-edge",
    "name": "Fingerboard 20 mm edge",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Hang for 10 seconds on a fingerboard with a 20 mm edge",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-bench-reverse-fly",
    "name": "Incline Bench Reverse Fly",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "The incline dumbbell reverse fly is an upper-body exercise targeting the posterior or rear deltoids, as well as the postural muscles of the upper back. Because it targets such small muscles, this exercise is usually performed with light weight for high reps, such as 10-15 reps per set or more.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "handstand-push-up",
    "name": "Handstand Push Up",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "shoulders",
      "chest"
    ],
    "view": "front",
    "description": "Handstands Push Up which demand high level of skill",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "zone-2-running",
    "name": "Zone 2 Running",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Zone two Cardio for endurance, you should be able to speak while running",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-dumbbell-row-ss-seated-shrug",
    "name": "LYING DUMBBELL ROW SS SEATED SHRUG",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "laying on the stomach on a bench with slight angle",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "suspended-crossess",
    "name": "Suspended crossess",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Suspension exercise with trx for chest training",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "biceps-with-trx",
    "name": "Biceps with TRX",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Grab the handles of the TRX straps, lean your body back, arms and legs extended, with your body positioned in a single straight line. (This is an arm exercise, not an abdominal one.)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kettlebell-swing",
    "name": "Kettlebell Swing",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Quads",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "quads",
      "abs",
      "upperBack"
    ],
    "view": "front",
    "description": "While kettlebell swings are a full-body workout, they mostly target the muscles along the posterior chain (back of the body). The main muscles used are the glutes, hamstrings, spinal erectors, and muscles of the upper back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "swimming-50m-sprints",
    "name": "Swimming 50m sprints",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "50m swimming sprints at 1min",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bear-walk-2",
    "name": "Bear Walk 2",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Glutes",
      "Lats",
      "Quads"
    ],
    "highlight": [
      "shoulders",
      "glutes",
      "lats",
      "abs",
      "quads",
      "upperBack"
    ],
    "view": "front",
    "description": "-Rest your weight on your palms and the balls of your feet, not dissimilar to normal pushup position -Move by stepping with your R palm and L foot, then your L palm and R foot. Basically, walk like a lumbering bear. -Move as fast as you can. Measure your reps/sets in either distance (i.e. 40 yards) or time (i.e. 45 seconds) -Works your Pecs, Deltoids, Triceps, Traps, Lats, Abs and Lower Back, Hip Flexors, Quads, Glutes and Calves",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "one-handed-kettlebell-curls",
    "name": "one-handed kettlebell curls",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Standing with the kettlebell in one hand and bent at the elbow, start from a fully extended position until your hand reaches shoulder height. To perform the movement correctly, try not to push with your back or body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "medicine-ball-booklet-crunch",
    "name": "Medicine ball booklet crunch",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Using a medicine ball as an overload will make the exercise heavier.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "box-squat",
    "name": "Box squat",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Set up the box: Position the box behind you, about 3 feet from a squat rack if you're using a barbell. Choose a height that allows you to squat down and gently tap your glutes on the box with your back straight. Stand with proper form: Stand with your feet shoulder-width apart, toes pointed slightly outward. Engage your core and keep your back neutral. If using a barbell, rack it at shoulder height. Lower down: Sit back as if going to sit on a chair, bending your knees and lowering your hips towards the box. Keep your core tight and back straight throughout the movement. Controlled descent: Descend in a controlled manner until your glutes gently touch the box. Don't plop down. Pause and press up: Briefly pause at the bottom with your back straight and core engaged. Then, press through your heels to drive yourself back up to the starting position. Improvements in coordination, balance and endurance, toning of the leg and buttock muscles and an overall increase in bone density eliminating the risk of osteoporosis.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "knee-raises",
    "name": "Knee Raises",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "The 90° leg raise on the bar is a very intense exercise that involves all the abdominal muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sloper-hanging",
    "name": "Sloper hanging",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Hanging on sloper holds of a fingerboard for a amount of seconds",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-ab-rollout",
    "name": "Barbell Ab Rollout",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Place a barbell on the floor at your feet. Bending at the waist, grip the barbell with a shoulder with overhand grip. With a slow controlled motion, roll the bar out so that your back is straight. Roll back up raising your hips and butt as you return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "elliptical",
    "name": "Elliptical",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Biceps",
      "Abs",
      "Triceps"
    ],
    "highlight": [
      "glutes",
      "biceps",
      "abs",
      "triceps"
    ],
    "view": "back",
    "description": "It improves muscle toning, strengthens the leg muscles (quads, glutes, calves), helps vascularisation and increases resistance. The elliptical is also very useful if you aim to lose weight. Teste",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-knees",
    "name": "High knees",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting positionStand straight. Steps: Run in place, putting knees as high up as is comfortable and switching legs at a quick pace.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pullup-on-fingerboard",
    "name": "Pullup on fingerboard",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Pullup on a choosen edge of a fingerboard / hangboard",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-up-rotations",
    "name": "Push-up rotations",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Get into the starting push-up position, with your hands and toes touching the ground and back, arms and legs straight. To get to this position, you can lie down on your stomach, place your hands facing down next to your head, and lifting your arms up until they are straight. Steps: Perform a standard push-up: 1.a Bend arms until chest almost touches the ground, making sure the back is straight.1.b Use your arms to lift yourself back up to starting position. Rotate your body to the side so that the back is straight, the bottom hand supporting the body is fully extended, and only the bottom hand and foot touch the floor. Repeat, changing sides at step 2 each time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kneeling-kickbacks",
    "name": "Kneeling kickbacks",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Get down on all fours. Steps: Push one foot back until fully extended, concentrating on the gluteus muscles. Stay for one second, then return to the initial position. Repeat, alternating feet.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-nordic-curl",
    "name": "Reverse Nordic Curl",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes",
      "Abs"
    ],
    "highlight": [
      "quads",
      "glutes",
      "abs"
    ],
    "view": "front",
    "description": "Natural Leg Extension is alternative to Leg Extension machine with no equipment.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "straight-bar-cable-curls",
    "name": "Straight Bar Cable Curls",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Standing upright in front of Cable Tower using a straight bar",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-fly",
    "name": "Cable Fly",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "cable machine, two steps forward, straight back",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jump-rope-basic-jumps",
    "name": "Jump rope: basic jumps",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Put your feet close together, bend the knees a bit, keep your head and body straight, keep elbows in, open your arms. Steps: Spin only your wrists with enough force to make the rope spin. Jump just high enough to pass the rope below your feet. Repeat. Notes: This exercise requires a jump rope. Make sure the rope length is adjusted to your height. One way to check is to grab both handles with one hand and stand on the middle of the rope hanging on the ground with one foot. If the rope (excluding the handles) reaches just below your chest, its length is right. A shorter rope would be hazardous, as you might hit yourself, and a longer rope would make for bad form.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-rows",
    "name": "TRX Rows",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "This exercise serves as a lead-up to Pull Ups.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-raises-pull-up-bar",
    "name": "Leg raises pull up bar",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [
      "Quads"
    ],
    "highlight": [
      "abs",
      "quads"
    ],
    "view": "front",
    "description": "with a firm grip with both hands on the bar, raise your outstretched legs, until you reach a 90° angle with your torso.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "mountain-climbers",
    "name": "Mountain climbers",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start in the upright push-up position, aka. the high plank position.Hands should be directly under your shoulders.Keep your head in line with your back, facing the floor.Feet should be about hip-width apart. Steps: Move one knee toward the center of your body, towards your elbows, keeping the other leg extended. In a quick jumping movement, straighten the bent leg out and pull the other knee toward your body. Keep repeating step 2, alternating legs. Notes: Throughout the exercise, your back should remain as straight as possible – avoid a hump or a sagging back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "4-count-burpees",
    "name": "4-count burpees",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand straight, feet hip-width apart. Steps: Squat low and support yourself on the floor with your hands between the knees and in front of your feet, your back straight. Keeping your hands on the floor, jump your legs backward into high plank position. Jump your feet forward to return to the squat position. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "no-push-up-burpees",
    "name": "No push-up burpees",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand straight, feet hip-width apart. Steps: Squat low and support yourself on the floor with your hands between the knees and in front of your feet, your back straight. Keeping your hands on the floor, jump your legs backward into high plank position. Jump your feet forward to return to the squat position. Jump up. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "floor-dips",
    "name": "Floor dips",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit with your arms behind you, supporting your back.Your fingers should point forward.Your knees should be bent, feet together. Steps: Raise your hips off the ground, straightening your arms. Bend your elbows, bringing your hips down. Straighten your arms, returning to the previous position. Repeat steps 2 and 3. Notes: The exercise's difficulty depends on how high you bring your hips.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "child-s-pose",
    "name": "Child's pose",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start on all fours, knees, toes, and hands touching the ground. Your two big toes should be touching. Steps: Move your knees so that they're about hip-width apart. On an exhale, move your pelvis back to sit on your heels. Your hands should still be touching the ground. Relax your upper body, lowering your forehead to the floor and letting your hands move forward naturally. Stay in this pose. Tips: To leave the pose, walk your arms back under your shoulders and move your upper body up into a seated position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kettlebell-deadlifts",
    "name": "Kettlebell deadlifts",
    "equipment": "Dumbbell",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand hip-width apart, with your kettlebell centered between your ankles. Your back should be straight, your head facing forward. Steps: Hinge at the hips and slightly bend at the knees to put your hands on the kettlebell handles. Your back should be straight as you perform the movement. Grab the kettlebell handles, with your hands pushing in opposite directions as if to pull the handle apart. While contacting your abs and glutes, stand straight up. Hinge at the hips again to bring the kettlebell back down, similarly to step 1. Repeat from step 3. Tips: Be sure you're performing the movements correctly, as doing otherwise can lead to injury. For example, do not squat instead of hinging at the hips, do not round your back while reaching for the kettlebell, and do not lean back while standing up.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "body-ups",
    "name": "Body-Ups",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Assume a plank position on the ground. You should be supporting your bodyweight on your toes and forearms, keeping your torso straight. Your forearms should be shoulder-width apart. This will be your starting position. Pressing your palms firmly into the ground, extend through the elbows to raise your body from the ground. Keep your torso rigid as you perform the movement. Slowly lower your forearms back to the ground by allowing the elbows to flex. Repeat as needed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-high-pulls",
    "name": "Bent High Pulls",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Bend over slightly while holding two dumbbells. Pull the dumbbells up to your chest, keeping your elbows as high as you can.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "chin-tuck",
    "name": "Chin tuck",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight. Steps: Use fingers on your chin to slowly tuck your chin in, moving your head back to align it with your spine. Hold for 5 seconds. Go back to normal head position and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "head-turns",
    "name": "Head turns",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight and shoulders down. Steps: Sit or stand up straight, shoulders dropped. Turn your head to the side as far as possible. Stop when you hit a barrier and hold for 5 seconds. Return to center position and repeat, changing sides.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "back-neck-stretch",
    "name": "Back neck stretch",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit upright on a chair or a firm pillow. Steps: Breathe out and tilt your head forward, chin to chest, putting hands behind your head. Use your hands to pull your head down lightly and press against your hands with your head to balance out the force. Hold for a bit. Relax your arms and head, opening up a bit with your shoulders. Keep repeating this from step 2 onward.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "blaze",
    "name": "Blaze",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Biceps",
      "Hamstrings",
      "Lats",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "biceps",
      "hamstrings",
      "lats",
      "abs"
    ],
    "view": "front",
    "description": "BLAZE is a full-body HIIT workout. Designed to supercharge your cardio fitness and strength. Delivered in its own purpose-built studio, BLAZE is a unique mix of martial arts, intense cardio and strength training.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lat-pulldown-wide-grip",
    "name": "Lat Pulldown (Wide Grip)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Execution Starting position: Arms extended overhead, feeling a stretch in your lats. Keep your shoulders depressed (don’t shrug upward). Pulling phase (concentric): Pull the bar down to your upper chest or collarbone area by driving your elbows down and back. Keep your chest lifted and squeeze your shoulder blades together at the bottom.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "alternating-bicep-curls",
    "name": "Alternating bicep curls",
    "equipment": "Dumbbell",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start standing up with dumbbells in each hand, your back straight and feet hip-width apart. Your arms should be relaxed, pointing down. Your knees should be slightly bent, your abs contracted, and your shoulders down. Steps: Bend one arm at the elbow, bringing the dumbbell up to your shoulder. Your upper arm should remain motionless during this movement. Bring the dumbbell back down until your arm is in its original relaxed position. Repeat, switching arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "head-tilts",
    "name": "Head tilts",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight. Steps: Tilt your head to one side and hold for a bit.2.Return your head to neutral position and hold for a bit. Tilt your head to the other side and hold for a bit. Return your head to neutral position yet again and hold for a bit. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "nordic-curl",
    "name": "Nordic Curl",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "hamstrings",
      "glutes"
    ],
    "view": "back",
    "description": "The Nordic hamstring curl is one of the best lower-body exercises to build posterior leg strength, improve knee health, and prevent injury.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-preacher-curl-close-grip",
    "name": "Reverse Preacher Curl (Close Grip)",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Sitting reverse on a Biceps Bench with a close grip",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "smith-machine-slight-incline-press",
    "name": "SMITH MACHINE SLIGHT INCLINE PRESS",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "laying under smith machine, with slight incline",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "chin-ups",
    "name": "Chin-ups",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "The chin-up (also known as a chin or chinup) is a strength training exercise. People frequently do this exercise with the intention of strengthening muscles such as the latissimus dorsi and biceps, which extend the shoulder and flex the elbow, respectively. In this maneuver, the palms are faced towards the body. It is a form of pull-up in which the range of motion is established in relation to a person's chin.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "burpees",
    "name": "Burpees",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Jump, lay down on your chest, do a pushup then jump, repeat",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "chest-press",
    "name": "Chest Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cross-bench-dumbbell-pullovers",
    "name": "Cross-Bench Dumbbell Pullovers",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Grasp a moderately weighted dumbbell so your palms are flat against the underside of the top plates and your thumbs are around the bar. Lie on your back across a flat bench so only your upper back and shoulders are in contact with the bench. Your feet should be set about shoulder-width apart and your head should hang slightly downward. With the dumbbell supported at arm's length directly about your chest, bend your arms about 15 degrees and keep them bent throughout the movement. Slowly lower the dumbbell backward and downward in a semicircle arc to as low a position as is comfortably possible. Raise it slowly back along the same arc to the starting point, and repeat for the required number of repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "deadhang",
    "name": "Deadhang",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Deadhang performed on an edge either with or without added weight (adujst edge or weight to adjust difficulty)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cycling",
    "name": "Cycling",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Hamstrings",
      "Glutes",
      "Lats",
      "Quads"
    ],
    "highlight": [
      "abs",
      "hamstrings",
      "biceps",
      "glutes",
      "lats",
      "quads"
    ],
    "view": "front",
    "description": "Cycling, also called bicycling or biking, is the use of bicycles for transport, recreation, exercise or sport. People engaged in cycling are referred to as cyclists, bicyclists, or bikers. Apart from two-wheeled bicycles, cycling also includes the riding of unicycles, tricycles, quadracycles, recumbent and similar human-powered vehicles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-woodchoppers",
    "name": "Cable Woodchoppers",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Set cable pulley slightly lower than chest height. Keep body facing forward with hips stable. Grab the pulley handle, fully extend your arms and bring your arms forward and across your body. Hold for 1 second at the end of the movement and slowly return to starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "deadbug",
    "name": "Deadbug",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Lie on your back, with your hips and knees bent to 90°. Raise both arms toward the ceiling. Pull your lower back to the floor to eliminate the gap. Start by pressing one leg out, and tapping the heel to the floor. \"As you extend one leg, exhale as much as you can, keeping your lower back glued to the floor,\" Dunham says. When you can’t exhale any more, pull your knee back to the starting position. Make this more difficult by holding weight in your hands, or by lowering opposite arm and leg.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "chin-up",
    "name": "Chin Up",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "The chin-up (also known as a chin or chinup) is a strength training exercise. People frequently do this exercise with the intention of strengthening muscles such as the latissimus dorsi and biceps, which extend the shoulder and flex the elbow, respectively. In this maneuver, the palms are faced towards the body. It is a form of pull-up in which the range of motion is established in relation to a person's chin.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "facepull",
    "name": "Facepull",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Attach a rope to a pulley station set at about chest level. Step back so you're supporting the weight with arms completely outstretched and assume a staggered (one foot forward) stance. Bend the knees slightly for a stable base. Retract the scapulae (squeeze your partner's finger with your shoulder blades) and pull the center of the rope slightly up towards the face. A good cue is to think about pulling the ends of the rope apart, not just pulling back. As you near your face, externally rotate so your knuckles are facing the ceiling. Hold for one second at the top position and slowly lower.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-ez-bar-cable-curls",
    "name": "Reverse EZ Bar Cable Curls",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Standing in front of cable tower using a SZ Bar",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "machine-chest-fly",
    "name": "Machine chest fly",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "seated machine, straight back, slow exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbells-on-scott-machine",
    "name": "Dumbbells on Scott Machine",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hyperextensions",
    "name": "Hyperextensions",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Lie on the hyperextension pillow with your navel at the front edge, allowing your upper body to hang freely. Tighten all your back muscles and raise your torso until you're horizontal, but no higher. Lower yourself slowly, maintaining a steady flow of muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-knee-jumps",
    "name": "High Knee Jumps",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "abs",
      "chest"
    ],
    "view": "back",
    "description": "-Start with legs slightly wider than shoulder width -Drop into a bodyweight squat -As you hit the bottom of the squat, explode upwards into a jump while simultaneously tucking your knees into your chest midflight. Remain tucked until the apex of your jump. -Land on both feet, making sure your knees are not locked so as to avoid excessive strain upon your joints. Collect yourself into the next rep as quickly but under control as possible.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-hip-thrust",
    "name": "Barbell Hip Thrust",
    "equipment": "Barbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Sit on the ground with a bench behind you, bending your knees so your feet are planted on the ground and holding a barbell resting below your hips. If you have a padded bar, or anything you can slip in between the bar and your body, it will go a long way to making the exercise more comfortable.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bus-drivers",
    "name": "BUS DRIVERS",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Sitting with a Weight Plate, used as wheel, in both hands; raised slightly below eye level",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hand-grip",
    "name": "Hand Grip",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "chrome Hand Flex Grip to build up forearms muscles",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hip-raise-lying",
    "name": "Hip Raise, Lying",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Lying down on your back, with your feet flat on the floor. Raise your hips up evenly as high as you can and hold for as long as you can.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hercules-pillars",
    "name": "Hercules Pillars",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "biceps",
      "shoulders"
    ],
    "view": "front",
    "description": "Grab two cables stand in the middle so both have tension and hold",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hip-thrust",
    "name": "Hip Thrust",
    "equipment": "Barbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "The bar should go directly on your upper thigh, directly below your crotch. Your feet should be directly under your knees. Push your hips up so that you form a straight line from your knees to your shoulders. Use a pad for comfort.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-pull",
    "name": "High Pull",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "shoulders",
      "glutes"
    ],
    "view": "front",
    "description": "Use a light barbell, perform explosive lift up starting from underneath knee cap level. Lift/raise explosively using hips, at shoulder level. Tempo: 2111",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hollow-hold",
    "name": "Hollow Hold",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Get on a mat and lie on your back. Contract your abs, stretch your raise and legs and raise them (your head and shoulders are also be raised). Make sure your lower back remains in contact with the mat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rope-pullover-row",
    "name": "Rope Pullover/row",
    "equipment": "Machine",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Set up bench in front of cable row machine. Lean over bench to do a row/pullover with rope that targets lats. See picture.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-arm-row",
    "name": "Single arm row",
    "equipment": "Machine",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Sitting on the ground, use a high cable in a single grip, to do lat pulldowns with a focus on a long stretch in the lats.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-clean-and-press",
    "name": "Barbell Clean and press",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "This exercise involves lifting a barbell from the ground to the shoulders, then pressing it overhead. It is a compound movement that targets multiple muscle groups, including the legs, back, shoulders, and arms. It is often used in strength and conditioning programs to improve overall power and athleticism.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-dumbbell-row",
    "name": "Incline Dumbbell Row",
    "equipment": "Dumbbell",
    "primary": "Back",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Using a neutral grip, lean into an incline bench. Take a dumbbell in each hand with a neutral grip, beginning with the arms straight. This will be your starting position. Retract the shoulder blades and flex the elbows to row the dumbbells to your side. Pause at the top of the motion, and then return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "good-mornings",
    "name": "Good Mornings",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-plate-raise",
    "name": "Front Plate Raise",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "The plate front raise is a variation of the dumbbell front raise where the lifter holds a weight plate between two hands, rather than using a dumbbell, barbell, or other weight. It can provide variety in a shoulder-focused muscle-building workout, or as part of an upper body or full-body circuit. While standing straight, hold a barbell plate in both hands at the 3 and 9 o'clock positions. Your palms should be facing each other and your arms should be extended and locked with a slight bend at the elbows and the plate should be down near your waist in front of you as far as you can go. Tip: The arms will remain in this position throughout the exercise. This will be your starting position. Slowly raise the plate as you exhale until it is a little above shoulder level. Hold the contraction for a second. As you inhale, slowly lower the plate back down to the starting position. Repeat for the recommended amount of repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "smith-press",
    "name": "Smith Press",
    "equipment": "Machine",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Sitting almost 90 degree angle, smith machine",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "isometric-wipers",
    "name": "Isometric Wipers",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "chest",
      "abs"
    ],
    "view": "front",
    "description": "Assume push-up position, with hands slightly wider than shoulder width. Shift body weight as far as possible to one side, allowing the elbow on that side to flex. Reverse the motion, moving completely over to the other side. Return to the starting position, and repeat for the desired number of repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jumping-jacks",
    "name": "Jumping Jacks",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "A jumping jack or star jump, also called side-straddle hop in the US military, is a physical jumping exercise performed by jumping to a position with the legs spread wide and the hands going overhead, sometimes in a clap, and then returning to a position with the feet together and the arms at the sides",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "landmine-press",
    "name": "Landmine press",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Chest",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-cross-over",
    "name": "Cable Cross-over",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Begin with cables at about shoulder height, one in each hand. Take a step forward so that one foot is in front of the other, for stability, and so that there is tension on the cables. Bring hands together in front of you. Try to make your hands overlap (so that the cables cross) a few inches.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jogging",
    "name": "Jogging",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Get your shoes on, go outside and start running at a moderate pace.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "long-pulley-narrow",
    "name": "Long-Pulley, Narrow",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps"
    ],
    "view": "back",
    "description": "The exercise is the same as the regular long pulley, but with a narrow grip: Sit down, put your feet on the supporting points and grab the bar with a wide grip. Pull the weight with a rapid movement towards your belly button, not upper. Keep your arms and elbows during the movement close to your body. Your shoulders are pulled together. Let the weight slowly down till your arms are completely stretched.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "straight-bar-cable-front-raise",
    "name": "Straight Bar Cable Front Raise",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Back to cable tower, cable between legs, SZ Bar",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "quadriped-arm-and-leg-raise",
    "name": "Quadriped Arm and Leg Raise",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "shoulders",
      "lats"
    ],
    "view": "front",
    "description": "In this exercise, the back muscles and the muscles of the back of the leg and back of the arm are activated by lifting the crossed arm and leg at the same time in the crawling position. It also improves balance and proprioception. The movement is done symmetrically. Get into a crawling posture.2. Draw your abdomen in, then raise your right leg and left arm.3. You should keep your abdomen in for 8 seconds.4. After 8 seconds, slowly lower your arm and leg.5. Then release your muscle.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "long-pulley-low-row",
    "name": "Long-Pulley (low Row)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps"
    ],
    "view": "back",
    "description": "Sit down, put your feet on the supporting points and grab the bar with a wide grip. Pull the weight with a rapid movement towards your belly button, not upper. Keep your arms and elbows during the movement close to your body. Your shoulders are pulled together. Let the weight slowly down till your arms are completely stretched.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-rotator-cuff-exercise",
    "name": "Lying Rotator Cuff Exercise",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "This is an excercise for problems with the levator muscles. Primary Infraspinatus, secondary Teres Minor. Lying on side. Keep elbow on waist and in 90 dgr angle. Rotate towards stomach. Add weight as fit.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "muscle-up",
    "name": "Muscle up",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "The body is then explosively pulled up by the arms in a radial pull-up, with greater speed than a regular pull-up. When the bar approaches the upper chest, the wrists are swiftly flexed to bring the forearms above the bar. The body is leaned forward, and the elbows are straightened by activating the triceps. The routine is considered complete when the bar is at the level of the waist and the arms are fully straight. To dismount, the arms are bent at the elbow, and the body is lowered to the floor, and the exercise can be repeated. As a relatively advanced exercise, muscle-ups are typically first learned with an assistive kip. The legs swing (kip) up and provide momentum to assist in the explosive upward force needed to ascend above the bar. More advanced athletes can perform a strict variation of the muscle-up which is done slowly, without any kip. This variation begins with a still dead hang and uses isometric muscle contraction to ascend above the bar in a slow, controlled fashion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "l-hold",
    "name": "L Hold",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Hold the L position for as long as possible",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "prone-scapular-retraction-arms-at-side",
    "name": "Prone Scapular Retraction - Arms at Side",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Lying on stomach with head on towel. Stretch arms straight out to your sides. Slowly lift your arms, pulling your shoulderblades together, hold for 3 seconds.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pike-push-ups",
    "name": "Pike Push Ups",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Push Up performed from a pike position (optional to have feet elevated).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-dumbbell-side-lateral",
    "name": "Seated Dumbbell Side Lateral",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "seated slightly leaned forward at beginning of exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "overhand-cable-curl",
    "name": "Overhand Cable Curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hands at shoulder height, curl arms in toward head, then back out.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-curl",
    "name": "Reverse Curl",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "The reverse-grip barbell curl is a variation on the biceps curl where the palms face downward. The switch from an underhand to an overhand grip brings the forearm and brachialis muscles more into the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "t-bar-row",
    "name": "T-Bar row",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "bent over with triangle grip, slightly bent knees",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-wood-chop",
    "name": "Front Wood Chop",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "roman-chair",
    "name": "Roman Chair",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Crunches on roman chair",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "modified-pulldown",
    "name": "Modified pulldown",
    "equipment": "Machine",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "With an inclined bench in front of the pulldown machine, use a close-grip to do latfocused pulldowns.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-bent-over-face-pull",
    "name": "Dumbbell Bent Over Face Pull",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "This exercise involves using dumbbells to perform a bent over face pull, which targets the upper back and shoulders. The movement involves pulling the weights towards the face while keeping the elbows high and squeezing the shoulder blades together.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "doorway-pectoral-stretch",
    "name": "Doorway Pectoral Stretch",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Place the forearm vertically on a door frame or stationary object at head height Step forward past the arm, keeping it still against the object to stretch the chest",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "run",
    "name": "Run",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Running or jogging outside in a park, on the tracks,...",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-bench-press-mp",
    "name": "Incline Bench Press - MP",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-plank",
    "name": "Reverse Plank",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Plank with stomach towards ceiling",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-dumbbell-trunk-flexion",
    "name": "Side Dumbbell Trunk Flexion",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "AKA dumbbell side bends. Stand in line with the hips with slightly bent knees, maintain the natural curvature of the spine, hand stretched by the body, grip the barbell with one hand. Make slow and controlled torso side flexions till you reach the angle of approximately 45°.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-lying-external-rotation",
    "name": "Side-lying External Rotation",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "With a weight in one hand, lie on your side opposite the weight. Keep your knees slightly bent. Hold your elbow against your side, and extend your upper arm straight ahead of you. While continuing to hold your elbow against your side, rotate your upper arm 90 degrees upwards. It is helpful to place a towel under your armpit to help with the form on this exercise. Placing a support under your head for the duration of the exercise is also a good idea.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "skipping-standard",
    "name": "Skipping - Standard",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Do a single, double footed jump for each swing of the rope. Work on a smooth, rhythmical movement, bouncing lightly on the balls of your feet.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-bends-on-machine",
    "name": "Side Bends on Machine",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "stationary-bike",
    "name": "Stationary Bike",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Ride a Stationary Bike with various tensions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "tricep-dumbbell-kickback",
    "name": "Tricep Dumbbell Kickback",
    "equipment": "Dumbbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Start with a dumbbell in each hand and your palms facing your torso. Keep your back straight with a slight bend in the knees and bend forward at the waist. Your torso should be almost parallel to the floor. Make sure to keep your head up. Your upper arms should be close to your torso and parallel to the floor. Your forearms should be pointed towards the floor as you hold the weights. There should be a 90-degree angle formed between your forearm and upper arm. This is your starting position. Now, while keeping your upper arms stationary, exhale and use your triceps to lift the weights until the arm is fully extended. Focus on moving the forearm. After a brief pause at the top contraction, inhale and slowly lower the dumbbells back down to the starting position. Repeat the movement for the prescribed amount of repetitions. Variations: This exercise can be executed also one arm at a time much like the one arm rows are performed. Also, if you like the one arm variety, you can use a low pulley handle instead of a dumbbell for better peak contraction. In this case, the palms should be facing up (supinated grip) as opposed to the torso (neutral grip).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "superman",
    "name": "Superman",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Lay flat on your stomach with your arms extended in front of you on the ground as your legs are lying flat. Lift both your arms and legs at the same time, as if you were flying, and contract the lower back. Make sure that you are breathing and, depending on your fitness level, hold the movement for at least two to five seconds per repetition.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-on-machine",
    "name": "Triceps on Machine",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Sit down and hold the bar firmly with your hands. Now press the weight upwards (don't fully extend your arms) and lower it slowly again. As with other triceps exercises, it's important not to move your upper arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-rope-forearm",
    "name": "Standing Rope Forearm",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Grab a wrist roller tool with both hands while standing with your feet about shoulder width apart. If your gym does not have a wrist roller tool, you can easily put one together. All you need is a 5 or 10 pound weight plate, a strong thin rope about 3 feet long and a 6-8 inch stick or bar. Securely fasten the rope to the middle of the bar/stick and tie the other end of the rope to the weight plate. To begin this exercise, grab the bar/stick with both hands using an overhand grip. Extend both arms straight out in front of you, parallel to the floor. Next, roll the weight up from the floor by rapidly twisting the bar/stick with your hands and wrists. Once the weight reaches the top, slowly lower the plate back to the floor by reversing the motion of your hands and wrists. Repeat (if you can!).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "turkish-get-up",
    "name": "Turkish Get-Up",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Shoulders",
      "Glutes"
    ],
    "highlight": [
      "shoulders",
      "glutes",
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "Starting on back, move to the standing position with dumbbell in one hand. Switch hands between reps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-cable-mid-trap-shrug",
    "name": "SEATED CABLE MID TRAP SHRUG",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "seated straight back, slight hold at top",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "curl-with-kettlebell-two-hands",
    "name": "Curl with kettlebell two hands",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Stand upright and grip the kettlebell with both hands. Perform the elbow flexion motion, starting from a fully extended position until your hand reaches shoulder height. Spread your legs a little for stability and, to perform the exercise correctly, try not to push with your back or body in general. Change the weight of the kettlebell to adjust the difficulty.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "power-clean",
    "name": "Power Clean",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Olympic weight lifting",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "weighted-step-ups",
    "name": "Weighted Step-ups",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "box step ups w/ barbell and 45's on each side",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "upper-external-oblique",
    "name": "Upper External Oblique",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Exercise for upper external oblique muscles",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trunk-rotation-with-cable",
    "name": "Trunk Rotation With Cable",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "abs",
      "lats"
    ],
    "view": "front",
    "description": "Seated trunk rotation with cable",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-slides",
    "name": "Wall Slides",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Stand with heels, shoulders, back of head, and hips touching the wall. Start with biceps straight out and elbows at a 90 degree angle. Straighten the arms while remaining againstthe wall without arching the back off of the wall, mimicking a shoulder press movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "overhead-press",
    "name": "Overhead Press",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "elevated-prayer-stretch",
    "name": "Elevated prayer stretch",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Starting position: Kneel in front of a bench, far enough so that your torso can fit between your knees and the bench. With your back straight, place your elbows on the bench, with palms together, hands pointing up. Steps: On exhale, stretch your chest down toward the floor without moving your lower back. At the same time, bring your hands toward your shoulders, keeping palms together and elbows on the bench. Hold for a few seconds. On inhale, relax your back to return to the starting position. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "quadruped-thoracic-rotation-left",
    "name": "Quadruped thoracic rotation left",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start kneeling on all fours, knees shoulder-width apart. Place your left hand behind your head while keeping your right hand outstretched and touching the floor. Steps: On inhale, move your left elbow toward your right hand, keeping your left hand behind your head. On exhale, move your left elbow to point up toward the ceiling. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "quadruped-thoracic-rotation-right",
    "name": "Quadruped thoracic rotation right",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start kneeling on all fours, knees shoulder-width apart. Place your right hand behind your head while keeping your left hand outstretched and touching the floor. Steps: On inhale, move your right elbow toward your left hand, keeping your right hand behind your head. On exhale, move your right elbow to point up toward the ceiling. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plate-twist",
    "name": "Plate twist",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Step 1: Sit on an exercise mat with your legs extended in front of you. Step 2: Grasp a plate in both hands as if holding a steering wheel, arms slightly bent, and hold it in front of your abdominals. Step 3: With knees slightly bent, cross your ankles and slowly lift them a few inches off the floor. Step 4: Keep your back straight but lean backward slightly to help maintain balance. Step 5: Exhaling, rotate your torso (twist) to the right side and touch the end of the plate to the floor. Step 6: Inhale and return to the forward facing start position. Step 7: Exhaling, rotate your torso (twist) to the left side and touch the end of the plate to the floor. Step 8: Inhale and return to the forward facing start position. Step 9: Repeat for a full set.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hindu-pushups",
    "name": "Hindu Pushups",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Exercise to strengthen the shoulders and pectorals. Its name is due to the fact that it begins in the Yoga position \"Dog Facing Down\", passing to \"Cobra\" but without resting the legs or torso on the ground to finally end with a normal flexion. The exercise can also be performed backwards (back to the starting position). As a variation, after doing the push-up, the hip can be raised to return to downward facing dog.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-dislocates",
    "name": "Shoulder dislocates",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand up with your back straight and a resistance band, towel, or broomstick handle in hand. With your hands straight in front of your body and the band between your hands, push your hands apart to both be at around 45 degrees from your body, thumbs facing down. If using a towel or broomstick handle instead, grab it with an overhand grip. Steps: Keeping your arms outstretched, rotate at the shoulders to bring your arms overhead and then down toward your glutes. Rotate at the shoulders in the opposite direction — overhead and then toward your groin. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-over-row-to-external-rotation",
    "name": "Bent over row to external rotation",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand behind a chair or in front of a table. Bend at the waist to put your forehead on the chair's headrest or table, keeping your back straight. Your arms should be hanging straight down, pointed at the floor. Steps: Bring your elbows up to shoulder height. Your forearms should be pointing down, perpendicular to your biceps. Your biceps should be at the same height as your back and perpendicular to your spine. Hold for a bit. Rotate at your elbows to bring your hands as far up as you can. Hold for a bit. Rotate at your elbows back to the previous position. Bring your arms down to the original position. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ywts",
    "name": "YWTs",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Lie down, preferably on a mat. Stretch your arms above your head in a \"Y\" position (arms pointing up diagonally at around 45 degrees). Your thumbs should be pointing up. Steps: With arms in the Y position, lift your chest slightly from the ground, creating a pull tension in your arms upward. Hold this position for several seconds (15–30 is ideal). Keeping your chest up, bend at your elbows to move from a Y position to a \"W\" position, with arms bent at the elbows and maintaining the upward tension. Hold for around as long as with the Y position. Still with your chest up, move to a \"T\" position, straightening your arms out to the side to be perpendicular to your body. Hold for around as long as you held the W position. Move from the T position to the W position, then from the W position to the Y position. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-bent-over-row",
    "name": "Dumbbell Bent Over Row",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Hold your dumbbells at your sides and hinge at the hips until your chest is parallel to the floor, dumbbells hanging below your knees (picture 1). Keeping your elbows close to your body, row both dumbbells towards your hips (oicture 2). Squeeze your shoulder blades down and together and lower under control to the start before repeating. Avoid using momentum from your torso and focus on squeezing your back, hard.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "close-grip-press-ups",
    "name": "Close-grip Press-ups",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Triceps"
    ],
    "highlight": [
      "biceps",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Drop into a strong plank position, bringing your hands close together until they're almost touching. (picture 1)Bend your elbows to slowly bring your chest to the floor (picture 2). Keep your elbows close to your body as you push back up explosively. Repeat. Ensure you take your time lowering on each rep, keeping your form sharp.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-hang-power-cleans",
    "name": "Dumbbell Hang Power Cleans",
    "equipment": "Dumbbell",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "On your feet, stand tall with your dumbbells, holding them at your sides. Hinge at the hips to lower them to your knees (picture 1). Stand back up with a slight jump, using the momentum to pull the dumbbells up on to your shoulders (picture 2). Stand up straight, then lower under control to your sides and repeat. Keep this fast and explosive; if your heart rate doesn’t hit the roof, you’re doing them wrong.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-sumo-deadlift",
    "name": "Dumbbell sumo deadlift",
    "equipment": "Dumbbell",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Lower your dumbbell to the ground between your legs. Assume a wide stance and with a straight back squat down. With the dumbbell standing upright, grip it by the top of the ‘head’ (picture 1).Keeping your chest up and core braced, push the floor away, driving back upwards to a standing position (picture 2). Repeat. If you can easily achieve 20-30 reps, use two dumbbells.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "medicine-ball-twist",
    "name": "Medicine ball twist",
    "equipment": "Machine",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "In a seated position, the torso is rotated from side to side without forcing, approaching the knees and making the ball touch the ground from time to time",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "vpushup",
    "name": "Vpushup",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Lift your body off the ground by pushing your arms upwards",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plank-shoulder-taps",
    "name": "Plank Shoulder Taps",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "shoulders",
      "lats"
    ],
    "view": "front",
    "description": "In the correct plank position, place your feet slightly wider than shoulder-width apart. alternately lift and touch the opposite shoulder with one hand.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "unilateral-cable-row",
    "name": "Unilateral Cable row",
    "equipment": "Machine",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "With an inclined bench in front of the cable row machine, do onehanded rows with focus on a big stretch in the lats.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-front-squat",
    "name": "Dumbbell Front Squat",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [
      "Shoulders",
      "Abs"
    ],
    "highlight": [
      "glutes",
      "shoulders",
      "abs"
    ],
    "view": "back",
    "description": "This exercise involves holding a dumbbell in each hand at shoulder height and performing a squat. It targets the lower body muscles, including the quads, hamstrings, and glutes, while also engaging the core and upper body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kettlebell-one-legged-deadlift",
    "name": "Kettlebell One Legged Deadlift",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "This exercise involves holding a kettlebell in one hand and standing on one leg while bending forward to touch the kettlebell to the ground. It targets the hamstrings, glutes, and lower back while also improving balance and stability.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-hip-thrust",
    "name": "Dumbbell Hip Thrust",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "This exercise involves sitting on the ground with a dumbbell resting on the hips, then thrusting the hips upward while squeezing the glutes. It is a great exercise for strengthening the glutes and improving hip mobility.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-incline-fly",
    "name": "Dumbbell Incline Fly",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "This exercise involves lying on an incline bench and holding dumbbells in each hand. The arms are then extended out to the sides, parallel to the ground, and then brought back together in a hugging motion. This exercise primarily targets the chest muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-shrug",
    "name": "Dumbbell Shrug",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "This exercise involves holding a dumbbell in each hand and shrugging your shoulders up towards your ears, then lowering them back down. It primarily targets the trapezius muscles in the upper back and can help improve posture and shoulder stability.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "weighted-crunch",
    "name": "Weighted Crunch",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "The Weighted Crunch is a variation of the classic crunch exercise that involves adding resistance (a weight) to increase the intensity of the abdominal work. Lay down (Optional) Bend your knees to add difficulty (Optional) Bend your knees and let your feet rest on a bench or a box or something (90 degree angle on knees) Lift your head and torso while bending your back forward (if you don't it's a sit-up and also involves some back muscles). The higher you go, the more you should feel your abs contracting. Go back to starting position an repeat",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "concentration-curl",
    "name": "Concentration Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "This exercise involves holding a dumbbell in one hand and curling it towards the shoulder while keeping the upper arm stationary. It primarily targets the biceps muscle.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-side-bend",
    "name": "Dumbbell Side Bend",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "This exercise involves holding a dumbbell in one hand and bending sideways to work the oblique muscles on the side of the body. It can be done standing or seated and is often used as a core strengthening exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-rear-lunge",
    "name": "Dumbbell Rear Lunge",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes",
      "calves"
    ],
    "view": "back",
    "description": "This exercise involves holding a dumbbell in each hand and stepping back into a lunge position, then returning to standing. It primarily targets the glutes, hamstrings, and quadriceps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-side-squat",
    "name": "Dumbbell Side Squat",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "This exercise involves holding a dumbbell in one hand and performing a squat while stepping to the side. It targets the legs, glutes, and core muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "machine-lateral-wise",
    "name": "Machine lateral wise",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "The machine lateral raise is an isolation exercise that targets the medial (side) deltoid muscle to build wider, more defined shoulders. The machine's fixed path of motion provides greater stability than dumbbells, making it ideal for beginners or those who want to focus solely on muscle activation.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "machine-chest-press-exercise",
    "name": "Machine Chest Press Exercise",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": ". It provides an effective but straightforward way to work your upper body. With no weights to balance and no tricky techniques to master, the chest press leaves you free to focus on your training.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "walking",
    "name": "Walking",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Walking outdoor or indoor, try keeping a pace of at list 100 steps per minute.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "flexi-n-lateral",
    "name": "Flexión lateral",
    "equipment": "Dumbbell",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "con una pesa en una mano, estiramos el brazo hacia abajo, flexionamos el otro brazo apoyando la mano en la cabeza. Ahora llevamos la mano con la pesa girando el torso arriba y abajo",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-romanian-deadlift",
    "name": "Dumbbell Romanian Deadlift",
    "equipment": "Dumbbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "This exercise involves holding a dumbbell in each hand and bending forward at the hips while keeping the back straight, then returning to a standing position. It primarily targets the hamstrings and glutes.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-skull-crush",
    "name": "Incline Skull Crush",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Siting in a 45 Degree Angle, using DB to do Incline Skull Crush",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rear-delt-raise",
    "name": "Rear Delt Raise",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "shoulders",
      "lats"
    ],
    "view": "front",
    "description": "Seated on a bench with the dumbbells on the floor bend over at 45 Degrees and then slowly raise each dumbbell to shoulder height and hold for a couple seconds before lowering to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-neck-stretch",
    "name": "Front neck stretch",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight. Steps: Open mouth wide. Slowly tilt head back with mouth opened. If you feel the need for support, clasp your hands behind your head. Very slowly close and open your mouth. At the end, slowly return to starting position and close mouth.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "2-handed-kettlebell-swing",
    "name": "2 Handed Kettlebell Swing",
    "equipment": "Dumbbell",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Two Handed Russian Style Kettlebell swing",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rowing-machine",
    "name": "Rowing Machine",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Sit on a rowing machine with your back straight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-bench-press",
    "name": "Seated Bench Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Set up the chest press machine so that the grips are aligned with your lower chest when you sit down. Make sure you're sitting with your back flat against the seat. Grab a handle in each hand, stick your chest out, and keep your head against the headrest. Breathe deeply and slowly push the handles forward until your arms are almost fully extended. Pause just before the lockout, then slowly return the handles to the starting position. Pause just before the handles come to a complete stop and perform another repetition.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-over-rowing-reverse",
    "name": "Bent Over Rowing Reverse",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps"
    ],
    "view": "back",
    "description": "The same as regular rowing, but holding a reversed grip (your palms pointing forwards): Grab the barbell with a wide grIp (slightly more than shoulder wide) and lean forward. Your upper body is not quite parallel to the floor, but forms a slight angle. The chest's out during the whole exercise. Pull now the barbell with a fast movement towards your belly button, not further up. Go slowly down to the initial position. Don't swing with your body and keep your arms next to your body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "abduction-while-standing",
    "name": "Abduction while standing",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Training a stable stance, predominantly on one leg, is crucial for both sides. On the one hand, it prevents discomfort and, on the other, it establishes a stable foundation. The practitioner assumes the usual standing position and, with a stable upper body, attempts to repeatedly lift the unloaded leg, bend it at the hip and knee, and then lower it again. The movement is also repeated on the other side. The exercise trains the stability of the hip-surrounding muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-rear-delt-rise",
    "name": "Seated rear delt rise",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Seated, bent 45 deg forward. Arms fully stretched out, raise arms up to shoulder height and back down",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dynamic-side-hold",
    "name": "Dynamic side hold",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Sling a rubber band on a kettlebell and lift the kettlebell by the rubber band. Let it hang by your side and stand on one leg, switch leg while continuing hold. Repeat with other hand",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-balls",
    "name": "Wall balls",
    "equipment": "Machine",
    "primary": "Shoulders",
    "secondary": [
      "Biceps",
      "Chest",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "biceps",
      "chest",
      "abs",
      "upperBack"
    ],
    "view": "front",
    "description": "Get a medicine ball, shoulder width stance, squat, thrust the ball as high as possible against the wall and catch",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "horizontal-traction-isometry",
    "name": "Horizontal traction isometry",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps"
    ],
    "view": "back",
    "description": "Perform a timed isometric pull-up on the bar",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "alternate-back-lunges",
    "name": "Alternate back lunges",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "The posterior muscles of the buttocks, hamstrings, soleus and gastrocnemius are trained more",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "walking-bridge",
    "name": "walking bridge",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Glutes",
      "Lats"
    ],
    "highlight": [
      "abs",
      "shoulders",
      "biceps",
      "glutes",
      "lats"
    ],
    "view": "front",
    "description": "from a standing position with knees slightly bent and hands resting on the floor. From here, proceed forward with your hands keeping your buttocks contracted and without losing control of your lower back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-knee-tuck",
    "name": "Seated Knee Tuck",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Sit on floor or mat. Place arms slightly behind you. Raise legs. Now extend your legs and pull them back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-concentration-curl",
    "name": "Cable Concentration Curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "The concentration curl is a classic exercise for building the biceps one arm at a time. It can be performed bent over or kneeling, but is more often performed seated on a bench. It's great for emphasizing the biceps peak and is often used to finish a biceps workout",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-ups-incline",
    "name": "Push-Ups | Incline",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Inclined push-ups primarily target the chest muscles (pectoralis major and minor), but also work the triceps, shoulders, and core to a lesser extent. Because the upper body is elevated, the incline push-up places less emphasis on the triceps compared to regular push-ups, which may be beneficial for individuals looking to specifically target their chest muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-ups-decline",
    "name": "Push-Ups | Decline",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Decline push-ups are another modified version of the traditional push-up that target the upper body muscles in a different way. To perform a decline push-up, elevate your feet on an elevated surface, such as a bench, chair, or step, while placing your hands on the ground in a push-up position. Lower your body towards the ground while maintaining a straight line from your shoulders to your ankles, and then push back up to the starting position. Unlike the inclined push-up, the decline push-up places more emphasis on the shoulders and triceps, while still engaging the chest muscles to a lesser extent. By elevating your feet, you increase the difficulty of the exercise by placing more weight on your upper body, forcing your shoulders and triceps to work harder to push your body back up. The decline push-up can be a great way to challenge your upper body strength and improve your ability to perform other push-up variations. As with any exercise, be sure to use proper form and start with a height that is appropriate for your strength and fitness level.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-ups-parallettes",
    "name": "Push-Ups | Parallettes",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Parallettes push-ups are a variation of the traditional push-up that are performed with the hands on parallel bars, known as parallettes. To perform a parallettes push-up, assume a push-up position with your hands on the parallettes and your feet on the ground. Lower your body towards the ground while keeping your elbows close to your sides, and then push back up to the starting position. Parallettes push-ups place more emphasis on the chest and shoulders compared to traditional push-ups, as they allow for a greater range of motion in the shoulder joint. This increased range of motion can also help to improve shoulder stability and mobility. Additionally, parallettes push-ups engage the core muscles more than traditional push-ups, as the instability of the parallettes requires greater activation of the core muscles to maintain proper form. The added challenge of balancing on the parallettes also requires greater upper body strength and control, making parallettes push-ups a more advanced variation of the traditional push-up. They can be a great way to challenge yourself and add variety to your upper body workout routine. As always, be sure to use proper form and start with a level that is appropriate for your strength and fitness level.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rest-for-timed-workouts",
    "name": "Rest (for timed workouts)",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "When creating a workout based on time, add this to add rest time in the program",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "3d-lunge-warmup",
    "name": "3D lunge warmup",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "As a warmup, use light dumbbells, one in each hand. Lunge in alternating directions, forward, sideways, backwards and 45 degree angles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-farmer-s-carry",
    "name": "Dumbbell farmer's carry",
    "equipment": "Dumbbell",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Grab half your body weight in each hand and walk.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "remo-maquina-agarre-estrecho",
    "name": "Remo maquina agarre estrecho",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Remo en máquina con barra en agarre estrecho",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "remo-maquina-agarre-estrecho-supino",
    "name": "Remo maquina agarre estrecho supino",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Remo en máquina o polea con agarre cerrado supino",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jal-n-abierto",
    "name": "Jalón abierto",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Movimiento descendente • Tire de la barra hacia abajo para que pase cerca de su barbilla y toque la parte superior de su pecho. • Mantenga el resto de su cuerpo inmóvil. Movimiento hacia arriba • Permita que sus codos se extiendan para permitir que la barra suba hasta la posición inicial. posición. • Mantenga el resto de su cuerpo inmóvil.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jal-n-abierto-supino",
    "name": "Jalón abierto supino",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Movimiento descendente • Tire de la barra hacia abajo para que pase cerca de su barbilla y toque la parte superior de su pecho. • Mantenga el resto de su cuerpo inmóvil.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jal-n-cerrado",
    "name": "Jalón cerrado",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Movimiento descendente • Tire de la barra hacia abajo para que pase cerca de su barbilla y toque la parte superior de su pecho. • Mantenga el resto de su cuerpo inmóvil.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jal-n-cerrado-supino",
    "name": "Jalón cerrado supino",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Movimiento descendente • Tire de la barra hacia abajo para que pase cerca de su barbilla y toque la parte superior de su pecho. • Mantenga el resto de su cuerpo inmóvil.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "extensi-n-de-gluteos-en-polea",
    "name": "Extensión de gluteos en polea",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Esta actividad te permitirá ejercitar la zona del glúteo superior o mayor. Por ello, nunca puede faltar en tu rutina de ejercicios aislados para trabajar los glúteos. Colócate en frente de una máquina de poleo y localiza el gancho inferior. Luego, sujétalo en las tobilleras para trabajar en polea baja. En relación a la postura, debes estar recto en todo momento. Presta especial atención a tu espalda para mantenerla derecha y no lastimarte. Es recomendable que te sujetes a la máquina para tener más equilibrio. Con la pierna que estás sosteniendo el peso de la polea, realiza un estiramiento lento para atrás sin flexionar la rodilla.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "extensi-n-de-gluteo-en-m-quina",
    "name": "Extensión de gluteo en  máquina",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Un ejercicio de extensión de cadera GHD es uno de los mejores ejercicios para glúteos. Si bien el ejercicio se enfoca principalmente en los glúteos, también es excelente para la zona lumbar, las pantorrillas y los isquiotibiales.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jalones-pecho-neutro",
    "name": "JALONES PECHO NEUTRO",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "El Jalón al pecho es un ejercicio importante para fortalecer la espalda y mejorar la postura, lo que puede contribuir a una vida más saludable. Para realizar este ejercicio correctamente y evitar lesiones, es importante seguir algunos pasos clave: Colóquese frente a la máquina de poleas con las rodillas ligeramente dobladas y los pies en el suelo. Agarre el mango de la polea con las palmas hacia abajo y las manos separadas a la anchura de los hombros. Tire hacia abajo del mango hasta que toque o se acerque al pecho, manteniendo la posición durante uno o dos segundos. Vuelva a subir el mango lentamente a la posición inicial, asegurándose de mantener los brazos y las manos rectos y la espalda recta durante todo el movimiento.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pull-over-polea-alta",
    "name": "PULL OVER POLEA ALTA",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "De pie, de cara al aparato, pies ligeramente separados, barra cogida en pronación, brazos extendidos, manos separadas una distancia igual a Ia anchura de los hombros. Espalda fija y la banda abdominal contraída, inspirar y llevar la barra hasta los muslos manteniendo los brazos extendidos. (o los codos ligeramente flexionados). Espirar al final del movimiento.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jalon-en-banco-inclinado",
    "name": "JALON EN BANCO INCLINADO",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Sobre el banco inclinado frete a la maquina de polea, con el cuerpo boca bajo sobre el banco, se realiza el jalón.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "arabesque",
    "name": "Arabesque",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Take all your weight onto one leg and you're going to maintain that position, keeping your hips and pelvis level the whole time. With your back in a neutral position you want to tilt yourself forward kicking your leg back up and then slowly with your glutes bring yourself back up to neutral.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "back-extensi-n",
    "name": "Back extensión",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Espalda en maquina de extensión con peso",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-pushdown",
    "name": "Triceps Pushdown",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Triceps pushdown on cable using lat bar.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "one-arm-bent-row",
    "name": "One Arm Bent Row",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "One arm bent over row on cable with a machine",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "curl-de-biceps-con-agarre-prono",
    "name": "Curl de biceps con agarre prono",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "POSICIÓN INICIAL: Seleccione el peso adecuado en una barra. Colóquese de pie con la barra usando un agarre prono y las manos a la anchura de los hombros. Contraiga el suelo pelvico y el core mientras mantiene su pecho levantado. EJECUCIÓN: Contrayendo los bíceps, doble los codos totalmente mientras exhala. Vuelva a la posición inicial con un suave movimiento mientras inhala.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "alternating-biceps-curls-with-dumbbell",
    "name": "Alternating Biceps Curls With Dumbbell",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold two barbells, the arms are streched, the hands are on your side, the palms face inwards. Bend one arm at a time and bring the weight with a fast movement up. At the same time, rotate your arms by 90 degrees at the very beginning of the movement. At the highest point, rotate a little the weights further outwards. Without a pause, bring the arm back down, slowly, and do the same with the other arm. Don't allow your body to swing during the exercise, all work is done by the biceps, which are the only mucles that should move (pay attention to the elbows).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "russian-twist",
    "name": "Russian Twist",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Hold a dumbbell, barbell weight or something else that is heavy with both hands, but make sure it is not too heavy and you are able to keep in form. Lean back to a 45-degree angle from the floor. For an extra challenge, lift your feet off the floor. Rotate your arms to one side to the same level as your chest, touch the floor for a little extra challenge, and then do the same to the other side. When you're back in your original position after doing both sides it will count as 1 rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pallof-press",
    "name": "PALLOF PRESS",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Chest",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "The Pallof press is an anti-rotation exercise that trains the larger and smaller muscles around the spine to resist rotation. Stand parallel to the cable machine or to the anchor point to the resistance band and clasp with the handle or band with both hands. Make sure your torso is front on and bring your hands to the center of your chest and slowly press out. Slowly return your hands to the chest and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-slides-squats",
    "name": "Side Slides + Squats",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Calves",
      "Glutes"
    ],
    "highlight": [
      "quads",
      "calves",
      "glutes"
    ],
    "view": "front",
    "description": "With feet a little wider than shoulder-width apart and staying low to mimic a defensive position, you should step with their lead leg and push off with their plant leg. After three slides, rotate your body for 180 degree on the guiding (/outer) leg and do a squat. Continue.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-drills",
    "name": "Wall Drills",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Calves"
    ],
    "highlight": [
      "quads",
      "calves"
    ],
    "view": "front",
    "description": "Exercises for strengthening knee and leg musculature. Lateral Wall Drills March - https://youtu.be/9RiTlJ6Mmek Lateral Wall Drills OPEN - https://youtu.be/ADRlN8-Wfdg Lateral Wall Drills CROSS - https://youtu.be/hGH2sj0Tzu4",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "inverted-rows",
    "name": "Inverted Rows",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [
      "Chest",
      "Abs"
    ],
    "highlight": [
      "biceps",
      "chest",
      "abs",
      "upperBack"
    ],
    "view": "front",
    "description": "Maintain a straight body, retract your shoulder blades, and pull your chest to the bar for an effective back and upper body workout.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "tibialis-raises",
    "name": "Tibialis raises",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Stand up straight Lift the balls of your feet, resting on your heels.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dragon-squat",
    "name": "Dragon squat",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Hamstrings",
      "Calves",
      "Glutes"
    ],
    "highlight": [
      "quads",
      "hamstrings",
      "calves",
      "glutes"
    ],
    "view": "front",
    "description": "Start standing with your feet hip-width apart. Cross your right foot behind you to the left corner and back of the room while bending both knees. Return and repeat, alternating sides. Keep your hips and shoulders forward as you cross your feet and bend your knees.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-lying-hip-abduction",
    "name": "Side Lying Hip Abduction",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Begin by lying down on your side with your top leg straight and your bottom leg bent for support. Lift your top leg off the ground (optional) - Hold position at the top Resources: 40 seconds YouTube video: https://www.youtube.com/watch?v=g9FtnmsIYgI",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calf-raises-left-leg",
    "name": "Calf raises, left leg",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Stand on the floor or on the edge of a step to increase the range of movement. Raise one foot. Lift your heel until you're standing on your toes. (variable) Stay in this position for three seconds Slowly lower your foot until you almost touch the ground with your heel - don't slam your foot!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cycling-cardio-session",
    "name": "Cycling cardio session",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Sessió de càrdio en bicicleta estàtica Technogym Bike Excite 1000",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wrist-curl-dumbbells",
    "name": "Wrist curl, dumbbells",
    "equipment": "Dumbbell",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Sitting on a bench, grab the dumbbell with your palms facing up and your hands shoulder-width apart. Rest your forearms on your thighs and allow your wrists to hang over your knees. Perform the movement by curling your palms and wrists towards your face. (optional/variable) Pause at the top. Slowly return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "scorpion-kick",
    "name": "Scorpion Kick",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Get into the push-up position with your shoulders directly above your hands and your feet hip-width apart. Make sure that your body forms a straight line from your head to your heels. Now pull your right knee towards your chest. While keeping your knee bent, lift your right leg as high as possible with your lower right leg pointing straight up. Now rotate your hips so that your right foot swings over your left leg. Continue to rotate and move your right foot towards the floor until you are forced to roll onto the outside of your left standing foot. Make sure that you do not rotate your upper body. Now return to the starting position and repeat the exercise with your right leg.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "prisoner-squat",
    "name": "Prisoner Squat",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Stand upright with your chest slightly raised, your feet hip-width apart and your toes pointing straight ahead. Bring your hands to the back of your head with your fingers slightly interlaced and your elbows pointing to the side. Push your hips back and bend your knees, keeping your upper body as upright as possible. Push your knees outwards, they must never point towards each other. If your upper body moves slightly forward, make sure that it does not bend. Always keep your elbows level with your ears by tensing the muscles between your shoulder blades. If you are flexible enough, you can sink down until your buttocks touch your calves. However, make sure that you do not bend your spine. Before this happens, reverse the movement and use your heels and glutes to push yourself upwards with so much momentum that your feet lift off briefly and you do a little hop. If necessary, correct the position of your feet, arms and upper body before you move on to the next repetition. Translated with www.DeepL.com/Translator (free version)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "skydiver-with-arms-in-t-position",
    "name": "Skydiver with arms in T-position",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Lie on your stomach with your legs more than shoulder-width apart and your feet up. Your arms are stretched out to the side and form a T with your upper body, your palms are on the floor. Now raise your upper body, arms and legs as high as you can while keeping your body under tension. Turn your thumbs towards the ceiling and pull your shoulder blades together. While keeping your upper body and all limbs in the air, bring your legs together and then spread them again, keeping them constantly in the air. For the remaining repetitions, only move your legs open and closed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "romanian-deadlift-single-leg",
    "name": "Romanian deadlift, single leg",
    "equipment": "Dumbbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Also known as: RDL. Steps:",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "full-sit-outs",
    "name": "Full Sit Outs",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "(A) Get in high plank position on your hands and toes.(B) Shift your weight to your left hand as you turn your body to the right; bend your right leg behind you and extend your right arm up. Return to the center and repeat on the opposite side. Continue, alternating sides.Make it easier: Don’t raise your arm after you bend your leg behind you.Make it harder: Balance with your arm and leg extended for two counts.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-snow-angel",
    "name": "Reverse Snow Angel",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Shoulders",
      "Hamstrings",
      "Glutes",
      "Abs"
    ],
    "highlight": [
      "upperBack",
      "shoulders",
      "hamstrings",
      "glutes",
      "abs"
    ],
    "view": "back",
    "description": "Lay flat on your stomach with your arms extended in front of you on the ground as your legs are lying flat. Lift both your arms and move them to your side slowly. Then, move them back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "recruitment-pulls",
    "name": "Recruitment Pulls",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Find a few specific edge sizes on a hangboard, get fixed underneath them with the board overhead, and pull with max effort, 1 arm at a time, for 3-5 seconds. When positioning for this get set up with a large elbow angle (120-150 degrees) and not in full extension.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "finger-pushup",
    "name": "Finger Pushup",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Hand Positioning: Start in a plank position with your hands directly beneath your shoulders. Spread your fingers wide apart, placing them firmly on the ground. Finger Placement: Gradually lift your palms off the ground, shifting the weight onto your fingers. Focus on distributing the load evenly across your fingertips and thumbs. Body Alignment: Maintain a straight line from head to heels to engage your core. Keep your body in a controlled and stable position throughout the exercise. Lowering Phase: Slowly bend your elbows, lowering your chest towards the ground. Ensure controlled movement, maintaining stability on your fingertips. Pushing Up: Press through your fingertips to straighten your arms, returning to the starting position. Emphasize the engagement of your fingers and thumbs throughout the push-up.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "knee-push-ups",
    "name": "knee push-ups",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Start by kneeling on the floor, keeping your knees together. Place your hands on the floor in front of you, slightly wider than shoulder-width apart. Make sure your body forms a straight line from head to knees. Hands should be positioned below shoulders. Lower your torso towards the ground, bending your elbows while keeping your trunk stable. Keep your knees in contact with the floor. Push through your hands to return to the starting position. Be sure to maintain contraction of chest, shoulder and arm muscles at the top of the movement. Perform the desired number of repetitions, controlling the movement and maintaining good form.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "australian-pull-ups",
    "name": "Australian pull-ups",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Lie down under a high bar or suspension bar, positioned at an appropriate height. Position yourself on your back under the bar, gripping the bar with a supinated grip (palms facing you). Adjust your position so that your body is aligned straight from head to toe. Arms should be fully extended, shoulders stabilized, and legs aligned with the rest of the body. Bend your elbows and pull your chest towards the bar, contracting your back muscles. Imagine you're trying to bring your shoulder blades together. Hold the contraction at the top of the movement for a moment to maximize muscle activation. Slowly return to the starting position, extending your elbows.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-chest-press-decline",
    "name": "Cable Chest Press - Decline",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Single arm chest press done with the cable machine. Use the other arm to brace bodyweight to focus on strength of the press, rather than balancing of the body. Start with the hand as close to the chest as possible, and then press against the cable at a slight decline and aiming towards the center of your chest.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-dumbbell-pendular-exercise",
    "name": "Shoulder Dumbbell Pendular Exercise",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Lean forward to rest your hand on a chair or other object, holding a dumbbell in the other hand Gently swing the dumbbell in a circular motion",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-external-rotation-with-dumbbell",
    "name": "Shoulder External Rotation with Dumbbell",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Lie on your side holding a dumbbell in your upper hand Tuck your elbow into your side and rest the hand in front of you Rotate the shoulder so the hand raises up Lower the hand down",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "claps-over-the-head",
    "name": "Claps over the head",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand with your feet shoulder width apart. Raise your arms and clap over your head",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-drag-curls",
    "name": "Dumbbell drag curls",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold a dumbbell in each hand with your palms facing forward. Pull your elbows back and lift the dumbbells to your chest height. Slowly lower the dumbbell and repeat the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-extension",
    "name": "Leg Extension",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "The leg extension is a resistance weight training exercise that targets the quadriceps muscle in the legs. The exercise is done using a machine called the Leg Extension Machine. There are various manufacturers of these machines and each one is slightly different. Most gym and weight rooms will have the machine in their facility. The leg extension is an isolated exercise targeting one specific muscle group, the quadriceps. It should not be considered as a total leg workout, such as the squat or deadlift. The exercise consists of bending the leg at the knee and extending the legs, then lowering them back to the original position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-shoulder-press-up",
    "name": "Incline Shoulder Press Up",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Place your hands on the bench in a press up position Push your chest away from the bench to separate your shoulder blades Keeping your elbows straight, lower your chest towards the bench so your shoulder blades move closer together Push your chest away from the bench again",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-wide-bicep-curls",
    "name": "Dumbbell wide bicep curls",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold a dumbbell in each hand with your hands slightly wider than shoulder-width apart and palms facing forward. Bend your elbows and lift the dumbbells to your shoulders. Slowly return and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "neck-extension",
    "name": "Neck extension",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Unilateral triceps exercise with your back to the pulley, with the pulley at the top",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-bicep-curl-to-press",
    "name": "Dumbbell bicep curl to press",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Bend your elbows and lift the dumbbells to your shoulders. Push the dumbbells over your head while rotating your arms to make your palms face forward. Reverse it to lower down. Repeat the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-rear-delt-row",
    "name": "Dumbbell rear delt row",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Hold a dumbbell in each hand. Bend at your hips to make your back almost parallel to the floor. Let your arms hang down. Keep your arms in line with your shoulders. bend and lift your elbows out to the sides until your upper arms are parallel to the floor. Slowly return and repeat",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-close-grip-bench-press",
    "name": "Dumbbell close grip bench press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Lie down with your back on a flat bench. Hold a dumbbell in each hand. Raise your arms towards the ceiling with your palms facing each other and dumbbells pressed together. Slowly lower the dumbbells to your chest, then slowly push them back. Repeat the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "snach",
    "name": "Snach",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand with your feet at hip width and your shins against the bar. Grasp the bar at double shoulder width and, keeping your lower back flat, drive your heels into the floor to begin lifting the bar. When it's above your knees, explosively extend your hips and shrug your shoulders. Let the momentum carry the weight overhead.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-upright-row",
    "name": "Dumbbell upright-row",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Hold a dumbbell in each hand in front of your body. Keep your palms towards your body. Lift you hands straight up until your hands are under your chin, then lower them. Repeat the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-stretch-left",
    "name": "Triceps stretch left",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Put your right hand on your back, use your left hand to grab your right elbow and gently pull it. Hold this position for a few seconds.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-cable-rows",
    "name": "Seated Cable Rows",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "“Stay leaned forward - tuck elbows in on the negative”",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-stretch-right",
    "name": "Triceps stretch right",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Put your right hand on your back, use your left hand to grab your right elbow and gently pull it. Hold this position for a few seconds.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-biceps-stretch-left",
    "name": "Standing biceps stretch left",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand with your left arm close to a wall. Extend your left arm and put your left hand on the wall, then gently turn your body to the right.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-biceps-stretch-right",
    "name": "Standing biceps stretch right",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand with your right arm close to a wall. Extend your right arm and put your left hand on the wall, then gently turn your body to the right.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-single-leg-hip-thrust",
    "name": "Dumbbell Single-leg Hip Thrust",
    "equipment": "Barbell",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings",
      "Quads"
    ],
    "highlight": [
      "glutes",
      "hamstrings",
      "quads"
    ],
    "view": "back",
    "description": "The single-leg hip thrust is performed by placing your upper back on a weight bench, raising one leg, and extending the hip of the other leg to achieve an isolated contraction of the glute. By working each side separately, you can fully isolate your glutes unilaterally, providing maximal training stimulus.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "remo-alto-polea-alta",
    "name": "Remo alto polea alta",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "High pulley row with support using a single grip",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "frog-stand",
    "name": "Frog stand",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Starting position: Stand with your feet shoulder-width apart and your toes pointing forward, facing a wall or bench for support if needed. Bend your knees into a squat position. Place your hands on the ground in front of you, shoulder-width apart, with your fingers spread wide. Make sure your elbows are under your shoulders and your body forms a straight line from your head to your heels. Upward phase: Push with your feet and hands to lift your body off the ground. Straighten your legs and arms, keeping your body aligned. Engage your core and glutes to maintain the position. If needed, rest your knees on the wall or bench for assistance.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-calf-stretch",
    "name": "Standing Calf Stretch",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "This stretch targets the gastrocnemius (the chief muscle of the calf of the leg, which flexes the knee and foot). It is easy to perform anywhere. All you need is a wall or a chair.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bag-training",
    "name": "Bag training",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Biceps",
      "Hamstrings",
      "Calves",
      "Lats",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "biceps",
      "hamstrings",
      "calves",
      "lats",
      "abs"
    ],
    "view": "front",
    "description": "Bag training improves muscle definition of: deltoids; rear deltoids; triceps; biceps, as well as being a great cardio exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-soleus-stretch",
    "name": "Standing Soleus Stretch",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "This stretch targets the Soleus part of your calf. It may be performed with a wall or chair.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "exercise-band-dorsiflexion",
    "name": "Exercise Band Dorsiflexion",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "This exercise uses an exercise band. It targets the Soleus and Tibialis anterior.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-cable-row",
    "name": "Seated Cable Row",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Take a seat on the machine with your feet planted, a little wider than shoulder width. Drive the heels, and squeeze the glutes. Grab onto the cable handle. Sit up tall with a slight bend through the knees. Tighten up the abs and low back to maintain a perpendicular angle to the floor with your torso. Roll the shoulders back and down. Squeeze them together as you row, thinking about pinching a pencil in between them. As you do this, pull the handle back towards you, landing right above your belly button. Pause here for a moment before returning the handle, still squeezing the shoulder blades. Once you've returned the weight to the stack, then allow the shoulder blades to relax, without pulling the torso forward. Repeat the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "exercise-band-plantarflexion",
    "name": "Exercise Band Plantarflexion",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Banded plantarflexion is a great way to bridge the gap between plantarflexion range of motion and the more strenuous calf raises in weight bearing. This can help strengthen the calf muscles, load the Achilles tendon, and improve plantarflexion range of motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "double-leg-calf-raise",
    "name": "Double Leg Calf Raise",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "The double leg heel raise is important to strengthen and create control and stability around the ankle and knee, and provide balance and control for the hip and pelvis.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "yoga-exercise-cow-cat",
    "name": "Yoga exercise: Cow-cat",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "abs"
    ],
    "view": "front",
    "description": "First get into the four-footed stance. The hands are underneath the shoulders. The fingers are fanned out wide and ensure a stable stance. It is best to rest your front body weight on your thumbs and index fingers. Now place your legs hip-width apart on the yoga mat. Your thighs should be vertically below your hips. Make sure that your weight is evenly distributed between your hands and knees. Your head is an extension of your spine and you are looking down at your mat. Your back is in a neutral position. Breathe in deeply and start with the cat. With the next exhalation, round your back vertebra by vertebra. Try to pull yourself as far as possible towards the ceiling. Pull your head towards your chest and tilt your pelvis. Now inhale deeply and move into the opposite position, cow pose. Bend your back down, pull your shoulders back slightly and lift your head as far as is comfortable for you. Your gaze is directed upwards. Breathe out consciously and switch back to the cat. With the next exhalation, switch back to cow. Repeat the exercise a few times and make sure that you are in the flow.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-lever",
    "name": "Front Lever",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "The front lever is a figure where the body is kept in a horizontal position parallel to the floor.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-width-three-point-push-up",
    "name": "Shoulder width three-point push-up",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Get into a push-up position with your shoulders directly above your hands and your feet hip-width apart. Draw your belly button in towards your spine and tighten your abdominal muscles. Lift your left foot about five centimetres off the floor. Point your toes straight down. Do not move your hips. Your body forms a straight line from your head to your heels throughout the exercise. Now bend your elbows, lower your chest to the floor and push yourself back up. Repeat the exercise on the other side.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-roll-out",
    "name": "TRX roll out",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "sostener las empuñaduras con las manos, alargar los brazos y mantenerlos paralelos a la altura del pecho. El movimiento que debes realizar es una abertura de los brazos alineados con los hombros mientas inclinas el cuerpo hacia delante. Intenta no realizar una extensión de hombro más allá de los 90º y mantén contraída la musculatura abdominal y los glúteos. Músculos implicados: Transverso, recto abdominal y erectores espinales",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ice-scream-maker",
    "name": "Ice Scream maker",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "lats",
      "abs"
    ],
    "view": "back",
    "description": "From the final phase of a pull-up, we push ourselves back with our shoulders until we reach the front lever position. From there, we pull ourselves back up to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-lever-pull-up",
    "name": "Front lever pull-up",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "biceps",
      "shoulders"
    ],
    "view": "front",
    "description": "in the front lever position, with legs extended or easier if collected, pull by bringing the chest closer to the bar.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-lever-tuck",
    "name": "Front lever tuck",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "The muscles involved in the Front Lever, most subjected to stress, are mainly the extensors such as: the latissimus dorsi, the teres major, the posterior deltoid and the long head of the biceps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-obliques",
    "name": "TRX Obliques",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Shoulders",
      "Chest"
    ],
    "highlight": [
      "abs",
      "shoulders",
      "chest"
    ],
    "view": "front",
    "description": "Place your feet in the stirrups and assume a high plank with your hands directly beneath your shoulders. Pull your knees to your right elbow, then push them back out and to the centre.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-hammer-curl",
    "name": "TRX hammer curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Place the grips as if they were a continuation of the straps. We will position our arms stretched forward and our body leaning back, completely straight. The biceps muscles will activate as you bend your elbows to bring your body towards the straps. The contraction movement will end with a slight outward movement of the hands, due to the grip we are using.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-external-rotation",
    "name": "Cable External Rotation",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Steps: Start off placing an extension band around a post or in a secure position where it will not release and is at elbow level. Position yourself to the side of the band and with your hand that is opposite of the band, reach out and grab the handle. Bring the band to your chest keeping your elbow bent in a 90 degree angle then slowly rotate your arm in a backhand motion so that the band externally rotates out Continue out as far as possible so that you feel a stretch in your shoulders, hold for a count and then return back to the starting position. Repeat for as many reps and sets as desired.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-gorilla-biceps-curl",
    "name": "TRX gorilla biceps curl",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "We'll stand facing the TRX straps and grab them with our fists facing each other, facing forward, with our arms fully extended at about shoulder-width apart. We'll keep our body straight, backward, as in the previous exercises, since we'll be lifting our body toward the TRX straps by activating our biceps. Our body will be straight, with our feet flat on the floor. This time, we'll place our arms open to the sides and at chest height. The movement we'll perform is a contraction toward our chest. To achieve this, we'll bend our elbows so that, by activating our biceps, we can pull our body toward the straps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-single-arm-bicep-curl",
    "name": "Trx Single Arm Bicep Curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "biceps",
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Step 1: Stand comfortably and grasp the handles of the suspension system. Step 2: Lean back resting your weight on one arm, keepng the spine neutral. Step 3: Slowly curl to pull your body weight to the up position. Supinate the arm and squeeze as you approach the end position. Step 4: Lower yourself back down and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "back-bridge",
    "name": "Back bridge",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [
      "Shoulders",
      "Hamstrings",
      "Calves",
      "Lats",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "hamstrings",
      "calves",
      "lats",
      "upperBack",
      "triceps"
    ],
    "view": "back",
    "description": "Lie on the floor with your back resting on the floor and your legs bent, feet flat on the floor, leaving about 20 cm between your feet and your buttocks. Your hands remain flat on the floor, pressed against your ears, with your fingers pointing toward your toes. Your elbows are bent and pointing toward the ceiling. This is the starting position. Now push your hips as high as you can, raising your body off the floor, and continue pushing through your hands, extending your elbows and knees, until your back is fully arched (lumbar bridge). Your head also comes off the floor and should be level with your elbows, looking back. This is the final position. The descent should be slow and controlled. Your spine should be in a convex curve. It's not good to lift your back off the floor; it should remain straight. It should be well rounded. You'll also notice a feeling of increased oxygenation in your back. After lifting off the floor, your hips should be very high, even above the level of your head. Your arms and legs should remain straight. It seems easy, but it requires a good level of flexibility. Breathing should be deep. This posture stretches the rib cage and puts pressure on the diaphragm. If the posture is performed correctly, breathing will be perfect. Never hold your breath during the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-tricep-extension",
    "name": "TRX Tricep Extension",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Attach the TRX or other suspension system overhead, having the handles hanging at chest level or slightly lower. Experiment to see what height allows you to set up in the best way. Stand in front of the handles and grab them with your palms facing down. Engage your abs, squeeze your glutes, take a breath and lean forward, lifting your heels off the floor. Keep your elbows straight. Take another breath and lower yourself slowly by bending your elbows. Go down until your elbows are at a 90-degree angle (to the point where your wrists are above your elbows). Hold the position for a moment. Extend your arms by engaging your triceps and bring yourself to the starting position as you exhale.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trx-dips",
    "name": "TRX dips",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "triceps",
      "chest"
    ],
    "view": "back",
    "description": "Start with the hands on the suspension trainer and feet on the ground. Your hands should be under your shoulders with the feet slightly in front. Lower yourself by bringing the hips between the handles and flexing the elbows. Extend the elbows to come back to the starting position and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "low-pulley-cable-fly",
    "name": "Low Pulley Cable Fly",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Adjust the cable machine: Set the pulley to the lowest setting possible. Choose your handles: You can use neutral grip handles (palms facing each other) or straight handles depending on your preference. Neutral grip might be easier on your wrists. Stand with proper form: Stand with your feet shoulder-width apart, knees slightly bent, and core engaged. Maintain a slight arch in your lower back throughout the exercise. Grip the handles: Grab the handles with your chosen grip and step back a small step or two until there's slight tension on the cables. Initiate the movement: Keep your elbows slightly bent throughout the exercise. Imagine you're giving someone a big hug. Squeeze your chest muscles as you bring your hands together in front of your chest. Control the movement: Focus on squeezing your chest muscles rather than using your arms to pull the handles. Peak contraction: Briefly hold the squeeze at the top of the movement with your hands together at chest level. Return slowly: Slowly release the tension and return the handles back down to the starting position with your arms slightly extended but not locked out.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "low-pulley-cable-ffly",
    "name": "Low Pulley Cable fFly",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Adjust the cable machine: Set the pulley to the lowest setting possible. Choose your handles: You can use neutral grip handles (palms facing each other) or straight handles depending on your preference. Neutral grip might be easier on your wrists. Stand with proper form: Stand with your feet shoulder-width apart, knees slightly bent, and core engaged. Maintain a slight arch in your lower back throughout the exercise. Grip the handles: Grab the handles with your chosen grip and step back a small step or two until there's slight tension on the cables. Initiate the movement: Keep your elbows slightly bent throughout the exercise. Imagine you're giving someone a big hug. Squeeze your chest muscles as you bring your hands together in front of your chest. Control the movement: Focus on squeezing your chest muscles rather than using your arms to pull the handles. Peak contraction: Briefly hold the squeeze at the top of the movement with your hands together at chest level. Return slowly: Slowly release the tension and return the handles back down to the starting position with your arms slightly extended but not locked out.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pullover",
    "name": "Pullover",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "chest",
      "lats"
    ],
    "view": "front",
    "description": "Doubling as a back and chest exercise, the Dumbbell Pullover can train both your pecs and lats.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sitting-calf-stretch-dorsiflexion",
    "name": "Sitting Calf Stretch (Dorsiflexion)",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "This is a light stretch for the calf that is great for rehab.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plantarflexion-stretch-with-band",
    "name": "Plantarflexion Stretch with Band",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "This stretch is for the ankles, as well as Tibialis anterior.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-dumbbell-bench-press",
    "name": "Incline Dumbbell Bench Press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "The incline dumbbell press is a mixture of the dumbbell chest press and the shoulder press, and both the front deltoids and the upper portions of the chest muscles are worked in this exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-dumbbell-press",
    "name": "Incline Dumbbell Press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "The incline dumbbell press is a mixture of the dumbbell chest press and the shoulder press, and both the front deltoids and the upper portions of the chest muscles are worked in this exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-chest-press",
    "name": "Dumbbell Chest Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "The dumbbell chest press is a pressing exercise similar to the barbell bench press, except that it is performed with dumbbells.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "biceps-close-grip-pull-down",
    "name": "Biceps Close Grip Pull Down",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [
      "Shoulders",
      "Lats"
    ],
    "highlight": [
      "biceps",
      "shoulders",
      "lats"
    ],
    "view": "front",
    "description": "On a lat pull down machine, hold the bar keeping your hands relatively close. Use an underhand grip (I.E.: the back of your hand must be facing the machine). Then pull down the bar in a straight line towards the ground. Make sure your biceps are the main drivers of the motion. You will probably feel your shoulders and lats working, but make sure your biceps are working more.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "isometria-trazioni-impugnatura-inversa",
    "name": "Isometria trazioni impugnatura inversa",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps",
      "upperBack"
    ],
    "view": "back",
    "description": "Trazioni in isometria con impugnatura inversa",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-chest-supported-dumbbell-row",
    "name": "Incline Chest-Supported Dumbbell Row",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Set up an adjustable bench at a 45-degree angle. Lay on your stomach with your head hanging just above the edge of the bench. Grab a dumbbell in each hand and set up with a good posture – core and lats engaged and shoulders neutral. Row the dumbbells toward the top of the stomach and squeeze the back at the top of the rep. Finally, lower the dumbbells back to the starting position and repeat until all reps are completed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pseudo-planche-push-up",
    "name": "Pseudo Planche Push-up",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "shoulders",
      "chest"
    ],
    "view": "front",
    "description": "You should have the shoulder line in front of your wrists an perform a push-up, maintaining the shoulder in the same position",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "talons-fesses",
    "name": "Talons fesses",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "calves",
      "hamstrings"
    ],
    "view": "back",
    "description": "Touch your heels to your buttocks, while remaining static or moving",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dynamic-planche",
    "name": "Dynamic Planche",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Start in a plank position, with your hands directly under your shoulders and your feet hip-width apart. Engage your core to keep your body in a straight line from head to toe. From this position, bend your knees slightly and jump with both feet inward, bringing them as close to your core as possible As soon as your feet touch the ground, push off forcefully to jump again and return to the starting plank position. Continue repeating this jumping motion, maintaining control and core stability throughout the exercise. Make sure to keep your breathing steady while jumping, breathing deeply and controlling your breathing. Keep your gaze fixed on the ground to maintain proper spinal alignment. Repeat the jumps for the desired length of time or the number of repetitions recommended for your workout program. To finish the exercise, rest by releasing the plank position, then stretch if necessary to loosen your muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reach-ups",
    "name": "Reach ups",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Pour effectuer cet exercice, allongez-vous sur le dos, bras étendus au-dessus de la tête. Ensuite, contractez vos abdominaux et soulevez votre torse du sol en tendant les bras vers le plafond pour \"atteindre\" le plus haut possible. Revenez lentement à la position de départ en contrôlant le mouvement. Les reach ups renforcent les muscles abdominaux et améliorent la flexibilité de la colonne vertébrale. Ils peuvent être intégrés à une variété de routines d'entraînement pour travailler la force et la stabilité du tronc.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "planche-de-cote-dynamique",
    "name": "Planche de cote dynamique",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "La planche latérale dynamique implique de se placer sur le côté, en appui sur un coude et le côté du pied, puis de basculer les hanches de haut en bas tout en maintenant une ligne droite du corps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-dumbbell-curls",
    "name": "Seated Dumbbell Curls",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Seated Dumbbell Curls are an effective bicep workout that isolates the muscles by stabilizing the upper body, reducing momentum that can detract from the exercise’s effectiveness. This exercise is performed sitting down with a dumbbell in each hand, focusing on controlled movement to maximize engagement of the bicep muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-grip-barbell-curls",
    "name": "Reverse Grip Barbell Curls",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold the barbell with an overhand grip (palms facing down) approximately shoulder-width apart. Ensure your back is straight, shoulders slightly pulled back, and arms fully extended. Curl the barbell upwards towards your chest in a controlled motion, keeping your elbows close to your body. The motion should be smooth without any swinging or momentum use. Once the barbell is at chest level, pause briefly to maximize contraction in the biceps and forearms. Slowly lower the barbell back to the starting position with a controlled movement, fully extending your arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trazioni-impugnatura-inversa",
    "name": "Trazioni impugnatura inversa",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "biceps",
      "abs"
    ],
    "view": "front",
    "description": "Trazioni alla sbarra con i i pollici rivolti verso l'esterno",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "one-armed-push-ups",
    "name": "One armed push-ups",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Abs"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "abs"
    ],
    "view": "front",
    "description": "Perform push-ups with one hand, alternating the sides",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "arco-femorale-una-gamba",
    "name": "Arco femorale una gamba",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Nello specifico i muscoli coinvolti sono: bicipite femorale. muscolo semimembranoso. muscolo semitendinoso.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-bench-press-nb",
    "name": "Barbell Bench Press - NB",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "The bench press is a compound exercise that builds strength and muscle in the chest and triceps. When many people think of listing, the bench press is often the first exercise that comes to mind",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "low-cable-cross-over-nb",
    "name": "Low-Cable Cross-Over - NB",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "The low-cable cross-over is an isolation movement that uses a cable stack to target the upper portion of the pectoral muscles. It is common in upper-body and chest-focused muscle-building workouts, often in combination with presses or flyes from other angles to target all portions of the chest.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ez-bar-skullcrusher-nb",
    "name": "EZ-Bar Skullcrusher - NB",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "The EZ-bar skullcrusher is a popular exercise targeting the triceps muscles. The EZ-bar is used more often than a straight bar. As for the name, that’s worst-case scenario. The bar should actually come down behind the head. It is usually performed for moderate to high reps as part of an upper body or arms-focused workout. No need to chase a 1RM on this move!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-cable-cross-tricep-extention-nb",
    "name": "High-Cable Cross Tricep Extention - NB",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "The high-cable cross tricep extension is an isolation exercise for targeting the triceps, particularly the long head. It utilizes cables and handles grasped with opposite hands, allowing for a unique pressing motion that can be effective for building tricep strength. Unlike exercises that use a straight bar or rope, this variation can be more comfortable on your wrists and elbows",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "preacher-curl-internally-rotated",
    "name": "Preacher Curl - Internally Rotated",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Single arm curl that can be done using a dumbbell and a preacher bench, or a preacher curl machine. Turn body towards the weight",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lat-pulldown-cross-body-single-arm",
    "name": "Lat Pulldown - Cross Body Single Arm",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Sit at lat pulldown machine with body at a diagonal angle so that only one leg is under the pad. Pull the cable down with the opposite arm. this will force the cable to across your body while pulling down. Emphasises the stretch of the lat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-chest-press-incline",
    "name": "Cable Chest Press - Incline",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Single arm chest press done with the cable machine. Use the other arm to brace bodyweight to focus on strength of the press, rather than balancing of the body. Start with the hand as close to the chest as possible, and then press against the cable at a slight incline and aiming towards the center of your chest.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jm-press",
    "name": "JM Press",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [
      "Biceps",
      "Chest"
    ],
    "highlight": [
      "triceps",
      "biceps",
      "chest"
    ],
    "view": "back",
    "description": "The JM press keeps your shoulders stationary, relying on the elbow flexion and extension to move the weight using your triceps strength. That means you get all the benefits of the best triceps-strengthening exercises without overtaxing that delicate shoulder joint. Classic win-win!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "helms-row",
    "name": "Helms Row",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats",
      "upperBack"
    ],
    "view": "back",
    "description": "Setup: Place your chest on the end of a bench, using a towel or anything soft to keep your chest protected. You want your chest to be in contact with the bench around the nipple line. Your back should be almost parallel to the floor Execution: When you’re starting the exercise, focus on pulling your elbows back until you feel maximum tightness in the lats. If you want to get some trap activation with the exercise, relax your shoulder blades when the weights are hanging down and then retract them as you start the rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "meadows-row",
    "name": "Meadows Row",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Biceps",
      "Abs"
    ],
    "highlight": [
      "lats",
      "biceps",
      "abs"
    ],
    "view": "back",
    "description": "The Meadows row is a unilateral row performed with a landmine setup, overhand grip, and staggered stance. Lean your torso forward and grip the barbell. Rest the other forearm on the forward leg. Start this movement by driving the elbow behind you while retracting the shoulder-blade. Keep the working shoulder down. Pull toward your back hip until the elbow is level with your torso.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-triceps-press",
    "name": "Cable Triceps Press",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "A single arm exercise that starts with the hand close to the chest with with the elbows bent, and the elbow flared out. Press forward and down against the cable straightening the elbow.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-tri-extension-internal-rotation",
    "name": "Cable Tri Extension - Internal Rotation",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "single arm exercise with cable held at opposite shoulder with elbow bent. Turn towards the cable, and the straighten the elbow across the body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-plank",
    "name": "Front Plank",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [
      "Chest",
      "Quads"
    ],
    "highlight": [
      "abs",
      "chest",
      "quads"
    ],
    "view": "front",
    "description": "The plank is a bodyweight exercise. As a multi-functional movement, the plank not only targets your abdominal muscles but also the spine and hip. Plank strengthens and tightens your entire body, improves your posture and balance, reduces body fat, and can help boost your metabolism. Exercises such as the “plank pose” help strengthen the stamina of stabilizing abdominal muscles. It can also help relieve back pain associated with a weakening of the function of the stabilizing muscles of the body. Planks are a versatile exercise that targets many of the most important muscle groups in the body, so they can be applied by anyone to improve endurance and overall body strength.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-tri-extension-external-rotation",
    "name": "Cable Tri Extension - External Rotation",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "single arm exercise with cable held at opposite shoulder with elbow bent. Turn away from the cable, and the straighten the elbow across the body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "curl-with-shoulder-elevated",
    "name": "Curl  - With Shoulder Elevated",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Place elbow so that it is about level with the shoulder. Curl the wieght to your shoulder. Focus on the stretch in the eccentric part of the curl",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-leg-raise",
    "name": "Lying Leg Raise",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Leg raise is one of the most effective exercises for the lower abdominal muscles. Although this exercise targets the rectus abdominus and oblique muscles, it is particularly useful for burning and tightening the lower fat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jumping-jack-hd",
    "name": "Jumping Jack HD",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes",
      "Abs"
    ],
    "highlight": [
      "quads",
      "glutes",
      "abs"
    ],
    "view": "front",
    "description": "Jumping jack are a plyometric exercise. Plyometrics are explosive aerobic moves that increase speed, quickness, and power and they work your whole body. Jumping jack target the arm, shoulder, abdominal muscles, hip muscles and hip flexors and also work on the thighs, knee tendons and quadriceps. Jumps are beneficial to your health because they combine cardiovascular conditioning with strength work. Since jumps elevate your heart rate, they can also improve your cardiovascular fitness.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bodyweight-squat-hd",
    "name": "Bodyweight Squat HD",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Calves",
      "Abs"
    ],
    "highlight": [
      "glutes",
      "calves",
      "abs"
    ],
    "view": "back",
    "description": "Squat is a type of bodyweight exercise. It is one of the most popular exercises for strength and muscle growth. Squat is particularly effective for focusing on the muscles of the leg and hips. Squat are an easy exercise for beginners to do. It can help strengthen leg muscles, tighten hip muscles and burn calories to lose weight. It tightens the butt and legs. Squats are very effective for firming and strengthening your legs by acting on the gluteus,hip flexors, quadriceps, hamstrings and inner thigh muscles. Also, bodyweight squats can help shape your glutes and butt.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plank",
    "name": "Plank",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Hamstrings",
      "Calves",
      "Lats"
    ],
    "highlight": [
      "abs",
      "hamstrings",
      "calves",
      "lats"
    ],
    "view": "front",
    "description": "A plank is an isometric core strength exercise that involves maintaining a position similar to a push-up for the maximum possible time. It can be effectively incorporated into general fitness regimens, high-performance athletic training programs, and even physical rehabilitation protocols.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-knee-skips-hd",
    "name": "High Knee Skips HD",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Biceps",
      "Glutes",
      "Quads",
      "Triceps"
    ],
    "highlight": [
      "abs",
      "biceps",
      "glutes",
      "quads",
      "triceps"
    ],
    "view": "front",
    "description": "You can use this exercise both as a dynamic warm-up before training and add it to your cardio training routine to burn fat. High knee skips are a plyometric exercise. Plyometrics are explosive aerobic moves that increase speed, quickness, and power and they work your whole body. High knee skips target the oblique, leg muscles, hip muscles and hip flexors and also work on the thighs, knee tendons, quadriceps and shoulders. Jumps are beneficial to your health because they combine cardiovascular conditioning with strength work. Since jumps elevate your heart rate, they can also improve your cardiovascular fitness.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "crunches-hd",
    "name": "Crunches HD",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Crunch movement is one of the most basic exercises designed to strengthen the core muscles of the body. Exercise helps to strengthen core muscles, improve posture, and increase muscle mobility and flexibility. Improves six pack muscles: When crunch exercise is done, the rectus abdominus and oblique muscles are tightened, so the upper abdominal muscles and six pack muscles develop. Increases the strength of the abdominal muscles: The primary role of your abdominal muscles is to stabilize your mid-section. It supports you while lifting heavy objects, allowing you to twist and rotate your body. These are all day long actions that you do not notice, so it is important that your abdominal muscles can sustain long hours of work. Crunch exercise helps build this important endurance in the abdominal muscles. Muscular endurance is the ability of these fibers to resist resistance for a long time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bench-dips-on-floor-hd",
    "name": "Bench Dips On Floor HD",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [
      "Shoulders",
      "Chest"
    ],
    "highlight": [
      "biceps",
      "shoulders",
      "chest",
      "calves",
      "upperBack"
    ],
    "view": "front",
    "description": "Triceps dips on floor are a compound exercise as they worked multiple muscle groups simultaneously. Although this bodyweight exercise mainly targets the triceps, it also hits your chest and front of your shoulder. Triceps dips on floor are one of the most effective exercises to increase arm strength and also build lean muscle in your upper arms. Triceps dips on floor are a closed kinetic chain exercise and express that you do the movements around a fixed point. It increases compression force on your joints thereby improving stability.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kopf-ber-gewichtaufheben",
    "name": "Kopfüber Gewichtaufheben",
    "equipment": "Dumbbell",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Diese Maschine neben Beinheben. Kopf nach vorne, mit dem gesicht zum boden und das Gewicht aufheben",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bodyweight-lunge-hd",
    "name": "Bodyweight lunge HD",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes",
      "calves"
    ],
    "view": "front",
    "description": "Bodyweight lunges are an effective calisthenic exercise for strengthening the lower body, improving balance and stability, and developing functional strength. They are a popular choice for bodyweight workouts, home workouts, and can also be included as part of a larger strength training routine.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lateral-push-off",
    "name": "Lateral Push Off",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "calves",
      "hamstrings"
    ],
    "view": "back",
    "description": "Push off the ground and land on one leg and regain balance before jumping to the other leg",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "one-arm-overhead-cable-tricep-extension",
    "name": "One Arm Overhead Cable Tricep Extension",
    "equipment": "Cable",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Set the pulley at the bottom of the cable machine and grab onto it without using any attachments. Extend the cable directly overhead. While keeping your back straight and upper arm stationary, lower the cable behind your head until you feel a good stretch in your triceps, and then extend it back upward until your elbow is locked out.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-swings-front-back",
    "name": "Leg Swings (Front–Back)",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Glutes",
      "Quads"
    ],
    "highlight": [
      "hamstrings",
      "glutes",
      "quads"
    ],
    "view": "back",
    "description": "Stand tall next to a wall or stable support. Swing one leg forward and backward in a controlled motion, keeping the torso upright and the core engaged. Alternate legs after completing the repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-hip-abduction",
    "name": "Seated Hip Abduction",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Starting Position: Adjust the seat height so that your knees are aligned with the pivot point of the machine. Sit with your back flat against the backrest, maintaining good posture. Place the outside of your thighs against the machine's padded levers. Position your feet flat on the footrests or platform of the machine. Grasp the handles or sides of the seat for stability. Ensure your spine is neutral and your core is slightly engaged. Movement: Exhale as you slowly push your legs outward against the resistance pads. Focus on initiating the movement from your hips, not your knees. Continue opening your legs until you feel a strong contraction in your outer hips and thighs. Hold the fully abducted position briefly (1-2 seconds) to maximize muscle engagement. Inhale as you slowly control the return of your legs to the starting position, resisting the weight throughout the movement. Avoid allowing the weight stack to touch down between repetitions to maintain constant tension on the muscles. Repeat for the desired number of repetitions, maintaining control throughout the set.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-floor-press",
    "name": "Dumbbell Floor Press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Sit on the floor holding a dumbbell in each hand, knees bent and feet flat. Roll back and plant your upper back and head on the floor; keep hips on the ground. Hold dumbbells at chest level with palms facing each other (neutral) or facing forward; elbows tucked at about 45–75° to the torso. Brace your core and press both dumbbells upward until arms are nearly extended but not locked. Pause briefly at the top, then lower the dumbbells under control until your upper arms contact the floor (or just above it) — this shortens the range of motion. Repeat for desired reps. Coaching notes: keep shoulders packed, avoid arching hips, use a spotter or lighter weight if needed. The floor press reduces shoulder stress and emphasizes lockout strength.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "forearm-curls-underhand-grip",
    "name": "Forearm Curls (underhand grip)",
    "equipment": "Dumbbell",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Muskulatur anspannen Kein Schwung holen Kontrollierte Bewegung Langsame Bewegung",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-overhead-dumbbell",
    "name": "Triceps Overhead (Dumbbell)",
    "equipment": "Dumbbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Ellbogen fixieren Muskulatur anspannen Kein Schwung holen Kontrollierte Bewegung Langsame Bewegung Immer angewinkelt lassen Nicht überdehnen",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-press-dumbbell",
    "name": "Shoulder Press (Dumbbell)",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Muskulatur anspannen Kein Schwung holen Kontrollierte Bewegung Langsame Bewegung Immer angewinkelt lassen Nicht überdehnen",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "schoulder-raise-dumbbell",
    "name": "Schoulder Raise (Dumbbell)",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Muskulatur anspannen Kein Schwung holen Kontrollierte Bewegung Langsame Bewegung Immer angewinkelt lassen Nicht überdehnen",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-bench-press",
    "name": "Dumbbell Bench Press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Lie on a flat bench and press dumbbells upward until arms are fully extended, then lower them slowly.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-angels",
    "name": "Wall Angels",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "upperBack",
      "shoulders"
    ],
    "view": "back",
    "description": "The Wall Angels exercise primarily targets the upper back and shoulder muscles, helping improve posture, shoulder mobility, and scapular control.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-figure-four",
    "name": "seated figure four",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Seat on a bench. Feet flat on the ground. Place your left ankle over your right knee. Your right knee stays flat. Keep your back straight. Gently push your left knee down.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lower-back-extensions",
    "name": "Lower Back Extensions",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Muskulatur anspannen Hintern ein wenig anheben Kontrollierte Bewegung Langsame Bewegung Kein Schwung holen Oberkörper gerade halten",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-hex-press",
    "name": "Dumbbell Hex Press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Muskulatur anspannen Füße Breitpositionieren Kontrollierte Bewegung Langsame Bewegung Gewichte zur unteren Brust/ Bauch führen",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "double-kettlebell-clean-and-press",
    "name": "Double Kettlebell Clean and Press",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Hamstrings",
      "Glutes",
      "Lats",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "hamstrings",
      "glutes",
      "lats",
      "abs"
    ],
    "view": "front",
    "description": "Full-body muscles building exercise. This exercise provides a huge range of benefits in terms of strength &amp; size and is extremely functional.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "double-kettlebell-front-squat",
    "name": "Double Kettlebell Front Squat",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings",
      "Calves",
      "Abs"
    ],
    "highlight": [
      "glutes",
      "hamstrings",
      "calves",
      "abs"
    ],
    "view": "back",
    "description": "The kettlebell front squat is a compound, multi-joint exercise that works several muscle groups.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "blackroll",
    "name": "Blackroll",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Kontrollierte Bewegungen Langsame Bewegungen Kein Schwung holen",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calf-raise-with-machine-seated",
    "name": "Calf Raise with machine (seated)",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "slow and controlled movement do not bounce on lower position Kontrollierte Ausführung Kein Schwung holen Langsame Ausführung",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-split-squat",
    "name": "Dumbbell Split Squat",
    "equipment": "Dumbbell",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Controlled execution No momentum Execute slowly",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-deadlift",
    "name": "Dumbbell Deadlift",
    "equipment": "Dumbbell",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Kontrollierte Ausführung Kein Schwung holen Langsame Ausführung",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "box-jumps",
    "name": "box jumps",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Calves"
    ],
    "highlight": [
      "glutes",
      "calves"
    ],
    "view": "back",
    "description": "Jump from a standing position onto the box, stretch your body, then step down again (do not jump)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rotary-torso-machine",
    "name": "Rotary Torso Machine",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Slow and Steady Not too much weight",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "recumbent-bike",
    "name": "Recumbent Bike",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "For this exercise Recumbent Bike is needed. You just sit on it, set level and time and start the workout",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "torso-twist",
    "name": "TORSO TWIST",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Standing Torso Twist WorkoutTarget your core and improve flexibility with this dynamic standing exercise! The Standing Torso Twist Workout involves twisting your torso while keeping your feet and hips stable, engaging your obliques, and stretching your entire upper body. This movement helps to:Strengthen core musclesIncrease flexibility in the spine and torsoImprove posture and balanceEnhance overall athletic performancePerform 3 sets of 10-15 reps, twisting to each side, to feel the benefits of this effective and efficient workout!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "band-pull-aparts",
    "name": "Band pull-aparts",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Hold the band with your arms extended in front of you at shoulder height. Keep your elbows slightly bent but fixed throughout the movement. Pull the band apart by spreading your arms until the band touches or comes close to your chest. Slowly bring your arms back to the starting position, controlling the tension on the band.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "upper-back",
    "name": "Upper Back",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Biceps",
      "Lats"
    ],
    "highlight": [
      "shoulders",
      "biceps",
      "lats"
    ],
    "view": "front",
    "description": "Upper Back is suitable for building up the core muscles with a special focus on the deltoid and rhomboid muscles and the upper back muscles",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-ups",
    "name": "Push-Ups",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Abs",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "abs",
      "triceps"
    ],
    "view": "front",
    "description": "1. Hands shoulder-width on the floor, fingers forward; feet together or hip-width; body in a straight line from head to heels; engage core and glutes. 2. Inhale and bend elbows, keeping them at ~45° from the torso (or closer for triceps focus); lower chest toward the floor until elbows reach ~90° or chest nearly touches. Briefly hold at the bottom with tension in chest and core. 4. Exhale and push through palms to extend elbows, returning to the starting plank position without locking elbows.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pullover-machine",
    "name": "Pullover Machine",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Chest",
      "Triceps"
    ],
    "highlight": [
      "lats",
      "chest",
      "triceps"
    ],
    "view": "back",
    "description": "Pullover machine, sitting, elbows on pads",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "zottman-curl",
    "name": "Zottman curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "With your palms facing forward, curl the weights up to your shoulders. Turn your hands so that that your palms downwards and slowly return the weights back down. Finally face your palms back forward.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "thruster",
    "name": "Thruster",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Start by doing a front squat At the top position, push the bar above your head (similar to a press) Lower the bar to the shoulders",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hamstring-kicks",
    "name": "Hamstring Kicks",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "hamstrings",
      "glutes"
    ],
    "view": "back",
    "description": "Stand with your feet hip-width apart and extend one arm in front of you. Swing that leg up in front of you and back down while keeping your leg as straight as possible and your toes pointed up.Repeat with the other leg.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-leg-rdl",
    "name": "Single Leg RDL",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "hamstrings",
      "glutes"
    ],
    "view": "back",
    "description": "Stand upright and hold weights in both hands if using loads. Brace your core and lift one leg off the ground. Keep your back straight, hinge at the hips while lowering your torso forward, ensuring you don’t rotate your hips. Lower until you feel a stretch in your standing leg's hamstring, then return to standing position. Repeat on both sides.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "toe-touch",
    "name": "Toe Touch",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Calves"
    ],
    "highlight": [
      "hamstrings",
      "calves"
    ],
    "view": "back",
    "description": "Stand with your feet closer together. Hinge at your hips and lower your upper body towards your toes. Reach your hands towards your feet, try to touch your toes, the ground, or as far down your legs as you can comfortably go.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-thruster",
    "name": "Dumbbell Thruster",
    "equipment": "Dumbbell",
    "primary": "Hamstrings",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "hamstrings",
      "shoulders"
    ],
    "view": "back",
    "description": "Start with the dumbbells resting on your shoulders and squat down. Push into standing and raise the dumbbells into an overhead position. Bring the dumbbells back to your shoulders and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "glute-bridge-single-arm-press",
    "name": "Glute Bridge Single-Arm Press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Hamstrings",
      "Glutes",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "biceps",
      "hamstrings",
      "glutes",
      "triceps"
    ],
    "view": "front",
    "description": "With one dumbbell in hand, perform a glute bridge. Now hold the dumbbell above your chest, this is the rep starting position. Lower the dumbbell so that your elbow touches the floor or is roughly 45 degrees below your shoulder if using a bench. Push the dumbbell back into the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bear-crawl-pull-through",
    "name": "Bear crawl pull through",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Hamstrings",
      "Calves"
    ],
    "highlight": [
      "shoulders",
      "hamstrings",
      "calves",
      "upperBack"
    ],
    "view": "front",
    "description": "Place a dumbbell at around hip level and assume a bear crawl position. Push the knees off the floor and hold. With the opposite hand reach for the dumbbell and pull it to the other side. Place your hand back on the floor and repeat with your other hand.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-dips-assisted",
    "name": "Triceps Dips (Assisted)",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "triceps",
      "chest"
    ],
    "view": "back",
    "description": "Assisted triceps dips is a gym work out exercise that targets triceps and also involves chest.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-lateral-raises-single-arm",
    "name": "Cable Lateral Raises (Single Arm)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "The single arm cable lateral raise is a variation of the lateral raise and an exercise used to build the muscles of the shoulders. Position a cable at the lowest position possible and attach a single handle. Reach across your body and grab the handle with a neutral grip. Keep the elbow slightly bent and pull the handle across your body and raise laterally. Slowly lower the handle back to the starting position under control.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "elephant-walks",
    "name": "Elephant Walks",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Calves"
    ],
    "highlight": [
      "hamstrings",
      "calves"
    ],
    "view": "back",
    "description": "Hinge at your hips until you feel a stretch behind your knees. Bend one leg while the other is straight then fluidly bend the other knee while straightening the first knee.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "good-morning",
    "name": "Good Morning",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Stand with your feet more than shoulder-width apart (wider stance) and place your hands on your hips. Hinge at your hips and lower your upper body towards the ground while keeping your back straight then come back up.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-leg-hamstring-stretch",
    "name": "Single Leg Hamstring Stretch",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Sit on the ground with one leg straight out in front of you and the other leg bent in toward you. Reach forward with both hands, trying to touch the toes of your straight leg.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sit-reach",
    "name": "Sit & Reach",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Sit on the ground with your legs extended straight in front of you. Reach both hands forward, trying to reach past your toes or as far as you can go. Return to the starting position and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "crossbody-leg-swings",
    "name": "Crossbody Leg Swings",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Hold onto a wall or something near you for support. Swing one leg across the front of your body, then back and out to the side. Repeat while slowly increasing your range of motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-pancake",
    "name": "Standing Pancake",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Stand and open your legs as wide as possible into a straddle position. Then bend at the hips, pushing them back while keeping your back straight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dead-bug",
    "name": "Dead Bug",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Core stability. Press lower back into floor. Opposite arm/leg. No hip-flexor load.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hamstring-chokes",
    "name": "Hamstring Chokes",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Sit on the ground and bend one leg, bringing your knee toward you. Place your hand behind your hamstring and gently pull your leg toward your chest, feeling a stretch in the back of your thigh. Straighten your leg, extending up toward the ceiling.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "roll-down",
    "name": "Roll Down",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Stand with your feet hip-width apart and slowly roll your upper body forward, one vertebra at a time, until your hands touch the ground or as far as you can comfortably go. Roll back up to the starting position in the same controlled manner.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "crossbody-hamstring-stretch",
    "name": "Crossbody Hamstring Stretch",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "While standing, cross one leg behind the other (keep this leg straight). Reach downward and try to touch the toes of that leg. Slightly bend the other leg so that you can bend down.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "preacher-curl-externally-rotated",
    "name": "Preacher Curl - Externally Rotated",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Single arm curl that can be done using a dumbbell and a preacher bench, or a preacher curl machine. Turn body away from the weight",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plank-to-elbow-extension",
    "name": "Plank-to-Elbow Extension",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "shoulders",
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "The Plank-to-Elbow Extension is a dynamic exercise that combines the plank with an elbow extension movement",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cossack-squat",
    "name": "Cossack squat",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Calves",
      "Abs"
    ],
    "highlight": [
      "glutes",
      "calves",
      "abs"
    ],
    "view": "back",
    "description": "The Cossack Squat is a multi-joint exercise that works mainly on the legs and buttocks, but also involves stabilizing muscles. It is an excellent exercise for improving strength, mobility and stability in a functional way.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-sit",
    "name": "Wall-sit",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Calves",
      "Abs"
    ],
    "highlight": [
      "glutes",
      "calves",
      "abs"
    ],
    "view": "back",
    "description": "The Wall Sit (or wall chair) is an isometric exercise that mainly involves the leg muscles, improving muscular endurance and stability. Here are the main and secondary muscles activated during the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dragon-flag",
    "name": "Dragon-flag",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Shoulders",
      "Glutes",
      "Lats",
      "Triceps"
    ],
    "highlight": [
      "abs",
      "shoulders",
      "glutes",
      "lats",
      "triceps"
    ],
    "view": "front",
    "description": "Keep your body completely rigid throughout the movement, avoiding sagging in your lower back. Use a firm grip to stabilize your upper body. Start with simpler versions (such as with bent knees) to build strength and control.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plank-with-alternating-leg-lift",
    "name": "Plank with Alternating Leg Lift",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "In a plank position, lift one leg alternately.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "heel-touches",
    "name": "Heel Touches",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Starting Position: Lie on your back on an exercise mat. Bend your knees, keeping your feet flat on the floor and hip-width apart. Place your arms along your sides, palms facing inward, just off the floor. Engage Core: Lift your head, shoulders, and upper back slightly off the ground. Keep your neck neutral and chin slightly tucked. Perform the Movement: Side-bend to the right, reaching your right hand toward your right heel. Return to the center, then side-bend to the left, reaching your left hand toward your left heel. Continue alternating sides in a controlled manner. Breathing: Exhale as you reach toward your heel and inhale as you return to the center.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bicycle-crunches",
    "name": "bicycle crunches",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Bicycle crunches are a core exercise performed on the floor. Lie on your back with your hands behind your head and legs extended. Lift your shoulders off the ground, bring one knee toward your chest, and twist your torso so your opposite elbow meets the knee. Alternate sides in a pedaling motion, ensuring controlled movements and engaging your core throughout the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hack-squats",
    "name": "Hack Squats",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Hamstrings",
      "Calves",
      "Glutes"
    ],
    "highlight": [
      "quads",
      "hamstrings",
      "calves",
      "glutes"
    ],
    "view": "front",
    "description": "Hack squats target the lower body and are performed on a hack squat machine or with a barbell. For the machine variation, position yourself on the platform with your shoulders under the pads and feet slightly forward. Push through your heels to lift the weight, then bend your knees to lower the platform in a controlled motion until your thighs are parallel to the ground. Push back up to the starting position. For the barbell variation, hold the bar behind your legs with your arms extended and perform a squat-like motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-crunches",
    "name": "Dumbbell Crunches",
    "equipment": "Dumbbell",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Dumbbell crunches are a weighted variation of traditional crunches designed to target the abdominal muscles more intensely. Lie flat on your back with your knees bent and feet flat on the floor. Hold a dumbbell with both hands close to your chest or above your head. Lift your shoulders and upper back off the ground in a crunching motion, engaging your core. Slowly lower yourself back to the starting position. Ensure controlled movements throughout the exercise to prevent strain.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "biceps-curl-machine",
    "name": "Biceps Curl Machine",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "The biceps curl machine is designed to isolate the biceps muscles and provide a controlled range of motion. Sit on the machine with your back against the pad and adjust the seat so your arms are aligned with the machine's handles or pads. Grip the handles firmly, keeping your elbows fixed in place, and curl the handles upward by contracting your biceps. Slowly lower the handles to the starting position, maintaining control throughout the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "toe-taps",
    "name": "Toe Taps",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Toe taps are a core-focused exercise performed lying on your back. Lie flat with your arms by your sides and your legs raised to a tabletop position (knees bent at 90 degrees). Slowly lower one foot to gently tap the floor, keeping your core engaged and your lower back pressed into the ground. Return to the starting position and alternate legs. This exercise strengthens the core while minimizing strain on the lower back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-side-crunches",
    "name": "Standing Side Crunches",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Standing side crunches are a dynamic exercise that targets the obliques while improving balance and stability. Stand upright with your feet shoulder-width apart and hands behind your head or holding a dumbbell in one hand. Lean your torso to one side, contracting your obliques, while bringing your elbow toward your hip (or crunching toward the weight if using a dumbbell). Return to the starting position and alternate sides or perform all repetitions on one side before switching.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-shoulder-rotations",
    "name": "Dumbbell Shoulder Rotations",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Dumbbell shoulder rotations are designed to strengthen the rotator cuff muscles and improve shoulder stability and mobility. External Rotation: Hold a dumbbell in one hand, keeping your elbow bent at 90 degrees and close to your body. Rotate your forearm outward, away from your body, keeping your elbow stationary. Slowly return to the starting position. Internal Rotation: Hold a dumbbell in one hand, keeping your elbow bent at 90 degrees and close to your body. Rotate your forearm inward, toward your body, and slowly return to the starting position. Perform the exercise with controlled movements to avoid strain.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plate-pinch-hold",
    "name": "Plate Pinch Hold",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "The plate pinch hold is a grip strength exercise designed to target the forearms and improve grip endurance. Select one or two weight plates (smooth-edged plates work best) and pinch them together between your thumb and fingers. Hold the plates with your arm straight down by your side or extended slightly in front of you. Maintain the hold for as long as you can, keeping your shoulders relaxed and your grip firm. This exercise can be done for time or repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-wood-chops",
    "name": "Reverse Wood Chops",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Quads",
      "Abs"
    ],
    "highlight": [
      "glutes",
      "shoulders",
      "biceps",
      "abs",
      "quads"
    ],
    "view": "back",
    "description": "Attach a looping resistance band to a rack below knee height Grip the other end of the band like holding a baseball bat with both hands Stretch the band facing it Start with your hands at the side of your hips, knees bent Rotate your hips while moving your hands towards over the top of your opposite shoulder Imagine the motion as striking a baseball with a bat",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lat-pull-db",
    "name": "Lat Pull DB",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "lats",
      "glutes"
    ],
    "view": "back",
    "description": "Bend upper body forward Move dumbbells near your body with slightly bent arms towards your back",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "scapula-pulls",
    "name": "Scapula Pulls",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Hang straight on a pull-up bar Pull shoulder blades together, moving the body slightly up",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pin-bench-press-bb",
    "name": "Pin Bench Press BB",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Set security pins to about the height of your sticking point Lower the bar, rest on the pins for 1s while holding tension Move bar up with maximum force",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pin-squat",
    "name": "Pin Squat",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "abs"
    ],
    "view": "back",
    "description": "Set security pins to about the height of your sticking point Lower the bar, rest on the pins for 2s keeping tension Stand up with maximum force",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "clean",
    "name": "Clean",
    "equipment": "Barbell",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings",
      "Lats",
      "Abs"
    ],
    "highlight": [
      "glutes",
      "hamstrings",
      "lats",
      "abs"
    ],
    "view": "back",
    "description": "Regular olympic lift clean. Pull bar from ground, catch on shoulders performing a front squat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pin-ohp",
    "name": "Pin OHP",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Set security pins to the height of your lower chin Rest bar on pins keeping tension Raise bar over head",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-ohp",
    "name": "Push OHP",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Rest bar in front on your shoulders Bend knees while keeping upper body straight Extend legs pushing the bar overhead with force",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-ohp-db",
    "name": "Incline OHP DB",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Sit on a bench with 45° incline Ellbows 45° out Move dumbbells down until upper arms are parallel to shoulders Move dumbbells up, meeting overhead",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kreis-press-db",
    "name": "Kreis Press DB",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Biceps",
      "Chest",
      "Abs",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "biceps",
      "chest",
      "abs",
      "triceps"
    ],
    "view": "front",
    "description": "Sit on a bench with 45° incline Hold dumbbells overhead Move dumbbells down as if doing overhead press Rotate dumbbells palms facing up and extend your arms in front of your body Move hands together until dumbbells meet, keep arms extended Reverse the motion until dumbbells are overhead again This is one repetition",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-raise-side-and-front-db",
    "name": "Shoulder Raise Side and Front DB",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand while holding dumbbells beside body Keep arms almost fully extended Without momentum raise dumbbells to the side of your body until shoulder height, palms facing down Lower dumbbells beside body, palms facing inwards Immediately raise dumbbells in front of your body until shoulder height, palms facing down Down again This is one repetition",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-chest-press-db",
    "name": "Incline Chest Press DB",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Bench 45° incline Hold dumbbells parallel on your chest Press up until arms extended",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jerk-ol",
    "name": "Jerk OL",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Glutes",
      "Quads",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "glutes",
      "quads",
      "triceps"
    ],
    "view": "front",
    "description": "Olympic lift jerk Hold bar in front on shoulders like push press Bend and extend knees pushing bar up while diving under the bar Catch bar overhead with straight arms using lunge Move feet parallel while holding bar in lockout",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "clean-and-jerk-ol",
    "name": "Clean and Jerk OL",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Lats",
      "Abs",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "lats",
      "abs",
      "upperBack",
      "triceps"
    ],
    "view": "front",
    "description": "Olympic lift clean and jerk. Combination of clean and jerk in one motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "snatch-ol",
    "name": "Snatch OL",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "shoulders",
      "lats"
    ],
    "view": "front",
    "description": "Olympic lift snatch Pull barbell from ground to overhead lockout using a wide grip and overhead squat. Move bar slowly until cleared knees then explosively extend hips, pull bar up and dive under the bar Catch bar overhead with straight arms Push head forward during lockout",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-w-curl",
    "name": "Seated W Curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Sit on bench with 60° incline Hold dumbbells beside body near the ground, palms facing outwards, arms fully extended Move dumbbells up using only biceps and without momentum",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "climbmill",
    "name": "ClimbMill",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Hamstrings",
      "Glutes"
    ],
    "highlight": [
      "quads",
      "hamstrings",
      "glutes"
    ],
    "view": "front",
    "description": "The ClimbMill, also known as a stair climber, is a cardio-focused machine that simulates climbing stairs. It provides an effective way to improve endurance while strengthening the lower body. To use the machine, step onto the moving stairs, maintain an upright posture, and use the handrails for balance if needed. Adjust the speed and intensity to match your fitness level. This exercise helps improve cardiovascular health, burns calories, and enhances lower body muscle endurance.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cobra-stretch",
    "name": "Cobra Stretch",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "The Cobra Stretch is a back extension exercise that helps improve spinal flexibility and relieve lower back tension. To perform, lie face down on the floor with your hands placed under your shoulders. Press your palms into the floor and lift your chest while keeping your hips on the ground. Keep your elbows slightly bent and your shoulders relaxed. Hold the stretch for a few seconds, then slowly lower yourself back down. This exercise is beneficial for improving posture and reducing lower back stiffness.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "torso-rotation-stretch",
    "name": "Torso rotation stretch",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "The torso rotation stretch helps improve spinal mobility and relieves tension in the lower back and obliques. It can be performed standing or seated. Standing Variation: Stand upright with your feet shoulder-width apart. Place your hands on your hips or extend your arms in front of you. Slowly rotate your torso to one side, keeping your hips stable. Hold for a few seconds, then rotate to the opposite side. Seated Variation: Sit on a chair with your feet flat on the floor. Place one hand on the outside of your opposite thigh and gently twist your torso toward that side. Hold the stretch before switching sides.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "knee-to-chest-stretch",
    "name": "Knee to Chest Stretch",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "The knee to chest stretch is a simple yet effective exercise for relieving lower back tension and improving hip mobility. To perform, lie flat on your back with your legs extended. Bring one knee toward your chest, wrapping your hands around your shin or behind your thigh. Gently pull the knee closer to your chest while keeping the other leg straight on the floor. Hold the stretch for 15–30 seconds, then switch sides. For a deeper stretch, both knees can be pulled toward the chest simultaneously.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "towel-superman",
    "name": "Towel Superman",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "lats",
      "shoulders"
    ],
    "view": "back",
    "description": "In this exercise, you lie flat on your stomach, hold a towel with your arms extended in front of you, and pull it apart to create tension. Then, you move it forward and back under your stomach. This exercise targets the back and shoulder muscles as well as core stability.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-press-around",
    "name": "Cable Press Around",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "shoulders",
      "biceps",
      "chest"
    ],
    "view": "front",
    "description": "Set the cable pulley at chest height and attach a D-handle bar. Grab the handle with a neutral grip and hold it next to your chest with your elbow fully flexed and tight to your side. Turn away from the pulley so your torso is at 45 degrees. Hold the other side of the functional trainer with your corresponding hand. Assume a staggered stance for better balance. While keeping your chest proud, extend your elbow at 45 degrees across your midline while keeping your arm parallel to the floor. Stop shy of lockout and contract your chest at the top of the range of motion (ROM).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cross-body-cable-y-raise",
    "name": "Cross-Body Cable Y-Raise",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Attach a D-Bar to the cable machine. Perform a motion akin to drawing a sword from across your body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "no-leg-drive-dumbbell-chest-press",
    "name": "No Leg Drive Dumbbell Chest Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Set up for a normal Dumbbell chest press but lift your leg ups straight or put them on another bench to remove the leg drive.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "punches",
    "name": "punches",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "stand stable and throw normal straight punches",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-underhand-dead-row",
    "name": "Dumbbell Underhand Dead Row",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "biceps",
      "lats"
    ],
    "view": "front",
    "description": "The Dumbbell Underhand Dead Row will involve the back, which means you can try a bit heavier weight. The catch is that you need to be able to control the weight for all the reps. Start by holding a pair of dumbbells with your feet shoulder-wide apart and your knees slightly bent. Hinge at your hips to lower your torse forward until it's almost parallel to the floor, keeping your back flat and maintaining a slight bend in your knees. Exhale as you row the dumbbells to your sides up to chest height, leading with your elbows until your upper arms are just past parallel to the floor and the dumbbells are at ribcage level. Slowly lower to the starting position and repeat. Keep your back flat all the time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pause-hack-squats",
    "name": "Pause Hack Squats",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Hamstrings",
      "Calves",
      "Glutes"
    ],
    "highlight": [
      "quads",
      "hamstrings",
      "calves",
      "glutes"
    ],
    "view": "front",
    "description": "Hack Squats but with a 1-2s pause at the bottom of the movement. This makes sure that there is no more elastic energy stored in the muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "spider-curl",
    "name": "Spider Curl",
    "equipment": "Machine",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "To get the most out of DB Spider Curls, you need an adjustable weight bench set at a 45-degree incline. This inclined position allows your arms to hang freely, putting them in an extended start position with elbows slightly in front of your torso, which is the key to maintaining low-level isometric tension throughout the movement pattern. Lie face-down on an adjustable weight bench with your chest fully supported, holding a pair of dumbbells. Keep a neutral head position and don’t crane your neck. Let your arms hang straight down with your palms facing forward (for a standard Spider Curl) or palms facing inward for a Hammer Curl exercise variation. Keep a stable foot position on the floor to maintain balance and control. Start the curl motion by flexing your biceps muscles and lifting the pair of dumbbells or curl bar toward your shoulders. Keep your elbow flexion controlled. Your arms should stay locked in position with no unnecessary movement. Squeeze hard at the top for 1-2 seconds. This is where maximum tension hits the biceps muscle fibers. Lower the weight under control for 3-4 seconds to keep muscles under tension for the entire range of motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calf-raise-using-hack-squat-machine",
    "name": "Calf Raise using Hack Squat Machine",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Ideally using a trapeze addon, Lift the weight up using your calves by getting on your toes.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-close-grip-barbell-bench-press",
    "name": "Incline Close Grip Barbell Bench Press",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [
      "Shoulders",
      "Chest"
    ],
    "highlight": [
      "triceps",
      "shoulders",
      "chest"
    ],
    "view": "back",
    "description": "Narrower grip than regular bench press, just outside shoulder width.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "floor-skull-crusher",
    "name": "Floor Skull Crusher",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Allowing you to safely load more weight than a regular skull crusher, lie on the floor and rest the weight on the floor in between each repetition.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-over-cable-flye",
    "name": "Bent over Cable Flye",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Holding your upper body at an approximate 105° angle.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "1-arm-half-kneeling-lat-pulldown",
    "name": "1-Arm Half-Kneeling Lat Pulldown",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Attach a D-Handle to a high pully. And use your lat muscles to pull the weight single handedly.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kroc-row",
    "name": "Kroc Row",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Dumbbell rows with looser technique but heavier weight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-shrug-in",
    "name": "Cable Shrug-In",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Attach two D-Handles to two low cables and shrug in using your upper traps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-cable-flye",
    "name": "Reverse Cable Flye",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Attach D-Handles to two cable pulleys in the upper position. Grab the left on with your right hand and vice-versa.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "w-raise",
    "name": "W-Raise",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "This challenging exercise is a variation of reverse crunches that is made up of three parts in which we’re basically drawing an upside down ‘W’ with our legs. Start position is lying face up flat on the floor with legs extended at the low point of the outer leg of the ‘W’. Keeping a strong core and legs straight, go up, rise your hips and then slowly lower your legs down halfway. Then, lifting your legs back up to the top, rise your hips again, maintaining that straight line, use your core strength to finally come back all the way down to the other outer leg of the W. Then you reverse the ‘W’ to return to the start.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "black-widow-knee-slides",
    "name": "Black Widow Knee Slides",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "In this bottom-up rotation exercise movement, you’ll cross your knee over and drive it into that opposite elbow. Start in high plank position (or tabletop position) with hands directly beneath your shoulders. Lift the left knee toward the right arm and slide it up the forearm to get more of that posterior pelvic tilt and engagement of the abdominal muscles. Then do the opposite side, bringing your right knee toward your left hand.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "butterfly-sit-up",
    "name": "Butterfly Sit Up",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "In this midrange exercise your arm muscles provide you with a little bit of momentum to help to get you off the ground. You also open them up in overhead position which engages the upper back. Start lying with feet flat on the ground, knees at an angle, arms crossed in towards your chest. Using your ab muscles, bring your upper body off the ground as you open your arms into goal post position, then slowly lower yourself back down to return to starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-corkscrew",
    "name": "Seated Corkscrew",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "To do this abs and obliques exercise, start with your hands back behind your body and bring your knees in and across, really trying to contract the obliques. Then extend your legs back out to starting position and repeat toward the opposite side of the abs. Beginners might find that they can’t even get through the first 45 seconds of this challenging reverse crunches variation. That’s ok because it gives you a place to start and something to improve upon.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "levitation-crunch",
    "name": "Levitation Crunch",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "For this top down movement, we’re trying to move the upper torso without moving the lower torso. Start lying on the ground with feet flat on the floor and crossed arms above your head with hands behind head. Lift upper body up and clear your shoulder blades off the ground and then hold and pause at the top for a one or two count. Try to make the upper abs work and hold that contraction for 10 good quality reps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sit-up-elbow-thrust",
    "name": "Sit Up Elbow Thrust",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "This is a top down rotation movement, and it’s a bit more explosive, too. Lying with knees bent and feet on the floor, sit up and then drive your left elbow across your entire body toward the right, then come back to center and then finally lower yourself down. Then hit the other side.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-triceps-extensions",
    "name": "Lying Triceps Extensions",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Starting position for this practical triceps exercise is lying on a standard bench holding a barbell or two dumbbells in both hands with an overhand grip, hands at shoulder width apart. Begin with arms over your upper chest and elbows bent back at about a 45-degree angle. First bend at the elbows and then allow the upper arm to drop back, bringing the barbell/dumbbells behind your head and down toward the floor. In terms of upper arm position, the barbell/dumbbells should never be fully above your head, but instead behind it, to ensure that you’re targeting the triceps. Keep the shoulder blades tucked under, the elbows tight in toward your head and your core active during this entire movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "drag-pushdown",
    "name": "Drag Pushdown",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Starting position for this rope pushdown is standing facing a cable machine with the handles of a rope attachment in both hands and feet shoulder width apart. Hinge forward slightly at the hips maintaining an upright chest and bring the shoulders and elbows behind the body so that when you push down on the cable attachments, you can get a fully contracted triceps long head. Drag the cable machine rope attachment as close to the body as possible and straighten your elbows until lockout.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-cheat-curl",
    "name": "Dumbbell Cheat Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Starting position is standing with feet shoulder width apart. Hands should take an underhand or supinated grip on the dumbbells holding them with hands shoulder width apart. Keeping elbows tucked into your sides throughout the entire movement, use momentum to curl the dumbbells, squeezing your biceps at the top of the movement. Slowly lower to return to the starting position. Keep the core tight throughout the exercise. Cheating through the concentric curling portion of this challenging exercise gives us a great opportunity to increase time under tension and create eccentric overload with heavier weight when we lower.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bizeps-curls-trifecta",
    "name": "Bizeps Curls Trifecta",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "This exercise is a mixture of three different curls: the Supinated Cross Body Curl, the Pronated Cross Body Curl and the No Money Curl. You alternate between three curl variations that each accomplish different goals, and you’ll keep the set going beyond the usual 8-12 rep range which gives us that intensity. For the Supinated Cross Body Curl, supinate the forearm with palms facing toward the ceiling and forearms coming across the body. Lift the inner-facing weight of the dumbbell towards your shoulder. For the Pronated Cross Body Curl, pronate the forearm with palms facing toward the floor (pronated grip or overhand grip) and forearms coming across the body. Lift the inner-facing weight of the dumbbell towards your shoulder. For the No Money Curl, you’ll curl the dumbbell as you outwardly rotate the shoulder. Lift the inner-facing weight of the dumbbell towards your outer side of the shoulder.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "omni-cable-cross-over",
    "name": "Omni Cable Cross-over",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Adjust the weights based on the motion. When pulling from top to bottom, increase the weight by 20% to 40% more than the bottom-to-top motion. This accounts for the fact that when operating from top down, the upper chest muscles are naturally weaker than the lower chest muscles. So, adjust your weight stack to compensate. Position one cable at a high setting and the other at the lowest level setting. Get into a staggered stance in between the cable towers. For the cable set low, pull it upward and across your body. This effectively targets the upper chest. For the cable set high, draw it downward and across your body. This will primarily engage the lower chest. Once you’re done, swap the positions of the cables. Change the previously high cable to the lowest position and vice versa. Repeat the exercise sequence, ensuring you’re targeting both chest regions effectively.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rocking-triceps-pushdown",
    "name": "Rocking Triceps Pushdown",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Set your feet below the rope and lean your upper body towards the rope. Set one foot back. Push down the rope and lean your entire body back onto the rear foot as you push down to get your hands behind your body. Don't forget to bring your chest to the front during the pushdown. As you release the rope slowly, lean your body back onto the front foot.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "alternating-high-cable-row",
    "name": "Alternating High Cable Row",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Start by putting the attachment in a high position on the cable station and step back about 1m from the attachment. Grab the cable pulley handle in your left hand at about head height with your elbow slightly bent. Step back with your left foot. Pull your elbow joint in toward the torso twisting slightly and perform a single-arm row. Engage the lats as you twist. Return to the starting position with cable pulley and left foot and grab the cable pulley handle in the right hand. Repeat this motion on the opposite side with your right foot stepped back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hyper-y-w-combo",
    "name": "Hyper Y W Combo",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Use a glute-ham raise or a stability ball for this exercise and a light weight plate in each hand. Raise your torso to form a straight line with your legs and raise the arms outward slightly beyond a 90-degree angle into a W position to hit the rotator cuff muscles, and then lower back to the starting position. Then raise up again with arms in a Y position to activate the lower traps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-pullover",
    "name": "Dumbbell Pullover",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Starting position is lying across a flat bench perpendicularly with your feet flat on the ground, holding a dumbbell overhead with both hands. With a slight bend in the elbow, begin lowering the dumbbell over and behind the head with the arm muscles in extended position. Then reverse the movement bringing the dumbbell back up and over the head. Keep your abdominal muscles tight and spine stable throughout allow repetitions and don’t allow your back to arch up away from the flat bench.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plank-jacks",
    "name": "Plank Jacks",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Calves",
      "Quads"
    ],
    "highlight": [
      "glutes",
      "calves",
      "quads"
    ],
    "view": "back",
    "description": "Jumping jacks from the plank position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-triceps-kickback",
    "name": "Lying Triceps Kickback",
    "equipment": "Dumbbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Set the bench to an 60deg angle. Stand still and rest your upper body on the inclined bench, ensuring a nearly straight line of your entire body. Squeeze your shoulder blades together, so that your elbows are located behind your torso with your upper arms nearly parallel to the floor. Lift the dumbbells until your arms form a straight line. Slowly lower the dumbbells back to the initial position. Initial position corresponds to an rectangular position of upper and lower arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "remada-unilateral-no-cabo",
    "name": "Remada unilateral no cabo",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "pegada neutra A remada unilateral, também conhecida como remada serrote, é um exercício que fortalece as costas e os bíceps, além de melhorar a postura.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-row",
    "name": "High Row",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Kneeling down on one leg and pulling cable down while driving elbow into the lats.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bayesian-curl",
    "name": "Bayesian Curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Cable curl with stretched shoulder (backwards)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sitting-calf-raises",
    "name": "Sitting Calf Raises",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Calf raises while sitting using extra weight on the platform.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "db-upper-chest-variation",
    "name": "DB Upper Chest Variation",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Dumbbell in hand in a curl fashion, lean body into the arm to help the dumbbell up above the chest, next to the head, to activate chest and delt combo",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "db-underhand-bench-press",
    "name": "DB Underhand bench press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Underhand grip DB, perform a normal bench press movement, keeping the elbows close to the chest",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "elbows-tucked-db-bench-press",
    "name": "Elbows Tucked DB Bench Press",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "triceps",
      "chest"
    ],
    "view": "back",
    "description": "Elbows Tucked DB Bench Press, chest press movement focusing on the triceps. DB stays parallel with body",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "db-skull-crushers",
    "name": "DB Skull Crushers",
    "equipment": "Dumbbell",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Alike tricpes extensions, DBs fall down near the head and pushed back up. Unlike for the triceps extension tring to extend the arms as far back",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "db-ucv",
    "name": "DB UCV",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Dumbbell upper chest variance. Curl like movement up above at head level, activating chest and front delts",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "alternative-db-gorilla-rows",
    "name": "Alternative DB Gorilla rows",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Slightly bent down and knees to mimic a gorilla position and pull/row up the DBs to the chest. DB stay straight (thumbs pointing up)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "db-cross-body-hammer-curls",
    "name": "DB Cross Body Hammer Curls",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Dumbbell cross body biceps curls, works on the braccialis",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-frog-press",
    "name": "Dumbbell Frog Press",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Similar to hip thrust, but with feet put up together, lifting the butt off the ground in a frog like position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-bradford-press",
    "name": "Dumbbell Bradford press",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "From a front hold of the DBs in a OHP, press above the head, bring back towards the rear of the shoulders, down, and press back forward.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-fly-middle-chest",
    "name": "Cable Fly Middle Chest",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Execution Start position: Arms extended out to your sides (a big “T” shape), feeling a stretch in your chest. Movement: Bring your hands together in front of your chest in a wide hugging motion. Focus on squeezing your chest at the center. Do not lock your elbows or turn it into a press. Return: Slowly open your arms back to the start, maintaining tension on the chest.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-fly-upper-chest",
    "name": "Cable Fly Upper Chest",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Execution Start position: Arms down and slightly behind your body, elbows slightly bent. Feel a light stretch across your chest. Movement: Bring your hands upward and together in front of your upper chest — roughly at chin to collarbone level. Use a smooth, controlled motion (avoid jerking). Squeeze your chest at the top for 1–2 seconds. Return: Slowly let your arms move back down and out to the sides, keeping control and tension.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-incline-smith-machine-press",
    "name": "High-Incline Smith Machine Press",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Set the bench to a 45-60° incline. Touch the upper chest with the bar.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-tricep-kickback",
    "name": "Cable Tricep Kickback",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Grab onto the handle, and pull your elbow up and back slightly above your torso. Keep your upper arm to be parallel to the ground for the duration of the set",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "neutral-grip-lat-pulldown",
    "name": "Neutral Grip Lat Pulldown",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Lat pull downs with a neutral grip on the bar.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kong-curl",
    "name": "Kong Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "This exercise is somewhat similar to a cable curl and a cable crossover. But instead of a chest/biceps exercise, this exercise targets the brachialis muscle, responsible for that broad arm when viewed from a front view. During the exercise, maintain a pronated forearm position with starting position of approx. 45 degree pronated. Start with slightly bend elbows and alternately curl until your hands (your thumb first) meet your upper middle chest (similar to how Kong hits his chest, thus the name of this exercise).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "drop-curl",
    "name": "Drop Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Drop curls in a modified position at a slow pace effectively engage the brachialis for arm width. Starting position is with both arms in a slight angle towards each other at chest height with a dumbbell in each hand. Lower one dumbbell close to full extended arm position slowly and in a controlled manner during the first half of the curl, then curl it back up to starting position, while the other dumbbell stays at its starting position. Now lower the other dumbbell down. This keeps tension on the brachialis. As we pass the 90deg mark on our way down, the biceps will take over the work.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "overhead-cable-tricep-extension",
    "name": "Overhead Cable Tricep Extension",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Use rope handle with your back against the cable machine. Straighten your arms until they are filly extended and reverse the motion resisting on the negative.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lateral-walk",
    "name": "Lateral Walk",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Lateral walks, also known as side steps or squat walks, are a type of exercise where you move sideways in a squatting position. They can be performed with or without resistance bands. These exercises strengthen the hip abductors, glutes, and other stabilizing muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-press-toe-press",
    "name": "Leg Press Toe Press",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Move the leg press using your calves by placing your feet at the bottom of the platform.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "handstand",
    "name": "Handstand",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Handstand free standing by pressing arms into the ground and contracting core and glutes",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-fly-lower-chest",
    "name": "Cable Fly Lower Chest",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Execution Start position: Arms extended out to your sides in a “Y” shape. Feel a stretch in your chest (slight bend in elbows — don’t lock them). Movement: Bring your hands downward and together in front of your lower chest or upper abs, in a smooth arc motion. Squeeze your chest hard at the bottom for 1–2 seconds. Return: Slowly raise your arms back up along the same path until you feel a good stretch in your chest. Maintain control — don’t let the weights pull you back too quickly.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-smith-press",
    "name": "Incline Smith Press",
    "equipment": "Machine",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "* Execution * Start position: Unrack the bar and hold it above your upper chest with arms fully extended. Keep your shoulder blades retracted and pressed into the bench. Lowering phase (eccentric): Slowly bring the bar down to just below your collarbone or upper chest. Maintain control — don’t bounce the bar. Pressing phase (concentric): Push the bar upward in a straight line until your arms are fully extended. Focus on squeezing your upper chest at the top. Lock and repeat: Complete your reps, then safely rack the bar back into the hooks.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "overhead-triceps-extension",
    "name": "Overhead Triceps Extension",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Overhead Triceps Extension with EZ Bar – Quick Guide The overhead position emphasizes the long head of the triceps (because it's stretched under load), the exercise does engage all three triceps heads (long, lateral, and medial) to some degree during extension. Setup: Sit on a bench (or stand) and hold an EZ bar with a narrow, overhand grip. Lift the bar overhead, arms fully extended. Keep your core tight and elbows close to your head. Execution: Slowly lower the bar behind your head by bending your elbows until they reach ~90°. Keep elbows pointed forward (not flaring out). Finish: Extend your arms back up to the starting position, squeezing your triceps at the top. Tips: Control the movement to avoid straining your shoulders. Use a moderate weight for full range of motion. Keep your back straight and avoid arching.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-static-hold",
    "name": "Incline Static Hold",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Execution Hold Position: Lower the dumbbells a few inches above your chest — about the midpoint of a normal incline press. This is where your upper chest is under maximum tension. Static Hold: Hold the position for 20–45 seconds while keeping the chest tight. Breathe slowly but stay tense — do not relax your chest or shoulders. End the set: After the hold, carefully bring the dumbbells down and rest.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pendular-hack",
    "name": "Pendular hack",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Pendulum hack, made on a pendulum machine",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "flat-machine-press",
    "name": "Flat Machine Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Execution Start position: Elbows bent at roughly 90°, hands just outside your chest. Keep wrists straight and aligned with your forearms. Pressing phase (concentric): Push the handles forward until your arms are almost fully extended — don’t lock out. Focus on squeezing your chest at the end of the movement. Returning phase (eccentric): Slowly bring the handles back toward your chest, feeling the stretch in your pecs. Maintain tension — don’t let the weight stack touch down between reps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sled-push",
    "name": "Sled Push",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [
      "Shoulders",
      "Hamstrings",
      "Triceps"
    ],
    "highlight": [
      "calves",
      "shoulders",
      "hamstrings",
      "triceps"
    ],
    "view": "back",
    "description": "Load the sled with 25% of your maximum load. If you don’t know this, choose a weight you can push for 10 minutes with short breaks. Beginners may choose to push the sled with no weight. Stand behind the sled and grab the poles with a high-grip hand position. Engage your core muscles and start pushing the sled forward as fast as you can, powering through your entire leg. Extend your hips and knees as you move the sled forward. Your foot stance should resemble your natural running position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "battle-ropes",
    "name": "Battle Ropes",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Chest",
      "Triceps"
    ],
    "highlight": [
      "hamstrings",
      "shoulders",
      "biceps",
      "chest",
      "upperBack",
      "triceps"
    ],
    "view": "back",
    "description": "Hold the ends of the rope at arm's length in front of your hips with your hands shoulder-width apart. Brace your core and begin alternately raising and lowering each arm explosively. Keep alternating arms for three to four sets of 1 to 2 minutes.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ball-slams",
    "name": "Ball Slams",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Glutes"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "glutes"
    ],
    "view": "back",
    "description": "Stand with your feet about shoulder-width apart, your knees and hips slightly bent, holding the ball in both hands at chest height. Engage your core, and keep a good posture. Extend your knees and drive your hips forward while simultaneously lifting the ball. Aim for being as tall as possible, the ball overhead, arms up, hips slightly forward, and on your toes from the force of your drive. Use your core and arms to slam the medicine ball straight down between your feet with as much force as possible. Press your hips back and bend your knees to further power the slam. Exhale as you slam the ball down. Squat down to pick up the ball from the floor, then immediately move into the next slam by repeating the movement. Repeat for reps or time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ski-machine",
    "name": "Ski Machine",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [
      "Hamstrings",
      "Glutes",
      "Quads",
      "Abs"
    ],
    "highlight": [
      "calves",
      "hamstrings",
      "glutes",
      "quads",
      "abs"
    ],
    "view": "back",
    "description": "Start standing on the platform with your feet hip-width apart. Reach overhead to grip the handles with your palms facing in. Soften your knees, then simultaneously drive your butt back as if you're closing a door behind you while pulling your arms straight down past your hips until your hands pass by the side of your knees. Next, bring your arms back overhead while thrusting your hips forward until you're standing with your arms fully extended. Repeat for reps, time or distance.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pendulum-squat",
    "name": "Pendulum Squat",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Hamstrings",
      "Glutes"
    ],
    "highlight": [
      "quads",
      "hamstrings",
      "glutes"
    ],
    "view": "front",
    "description": "Place your feet in the middle of the plate at about shoulder width. Tense your torso. Keep your neck relaxed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "glute-drive",
    "name": "Glute Drive",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings",
      "Quads"
    ],
    "highlight": [
      "glutes",
      "hamstrings",
      "quads"
    ],
    "view": "back",
    "description": "Lie down on the back pad and strap yourself in with the waistband. Position yout feet shoulder-length apart. They should be slightly splayed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "toes-to-bar",
    "name": "Toes to bar",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "The name \"Toes to Bar\" says it all: This exercise, in which you hang from a pull-up bar, involves bringing your toes toward the bar, pointing toward your face. This really works your abdominal muscles. \"Toes to Bar\" is popular in functional fitness programs like Freeletics and CrossFit, and is an effective exercise for six-pack training.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-dumbbell-curls",
    "name": "Lying Dumbbell Curls",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Take a dumbbell in each hand and lie backwards on a bench, similar to a classic chest press. Let your arms hang down at your sides, with the dumbbells possibly touching the floor. Now start to lift the dumbbells upwards until your forearms are perpendicular to the ceiling. Slowly lower the dumbbells until they almost touch the floor again. Keep your ellbows in place to minimize cheating.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-curls",
    "name": "Cable Curls",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Bicep Curls using cables. Can be seated or standing",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pull-ups-wide-grip",
    "name": "Pull-Ups (Wide Grip)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Execution Pulling phase (concentric): Drive your elbows down and slightly back, pulling your chest toward the bar. Focus on leading with your chest, not your chin. Keep your shoulders depressed (avoid shrugging). Top position: Chin should clear the bar (or at least reach bar level). Pause for a brief squeeze in your lats.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-row-overhand",
    "name": "Barbell Row (Overhand)",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Execution Starting position: Hold the barbell with arms fully extended toward the floor. Maintain tension in your lats and back muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-row-underhand",
    "name": "Barbell Row (Underhand)",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Execution Starting position: Hold the barbell with arms fully extended toward the floor. Maintain tension in your lats and back muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-bicep-curl",
    "name": "lying bicep curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "RP fitness bicept curle variant to get a good streach on bicept",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "delt-stretch",
    "name": "Delt Stretch",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stretch your deltoids for a certain period of time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pull-up-isometric-hold",
    "name": "Pull-up Isometric Hold",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold the pull-up movement in any position",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-romanian-deadlift-rdl",
    "name": "Barbell Romanian Deadlift (RDL)",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Execution Hinge at the hips: Push your hips backward, keeping a slight bend in the knees (soft knees). Lower the barbell along the front of your thighs/shins while maintaining a neutral spine. Keep the bar close to your body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "one-arm-heavy-row",
    "name": "One-Arm Heavy Row",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Execution Rowing phase (concentric): Pull the dumbbell toward your lower chest or waist, leading with your elbow. Keep your torso stable — avoid twisting or rotating your shoulders. Pause at the top and squeeze your lats.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jal-n-al-pecho-con-agarre-ancho",
    "name": "Jalón al pecho con agarre ancho",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps"
    ],
    "view": "back",
    "description": "The lat pulldown is a pulling exercise that primarily targets the latissimus dorsi muscles (commonly known as “lats”) in your back. It involves pulling a cable bar or handle down towards your chest while seated on a machine specifically designed for this exercise. The lat pulldown is typically performed with a wide grip, but can also be done with a narrow grip or underhand grip to target different muscle groups in the back and arms. It is a popular exercise for building upper body strength and improving posture.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "patadas-traseras",
    "name": "Patadas traseras",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "The dumbbell kickback is a popular strength training exercise that targets the triceps muscles in the back of your upper arms. It helps strengthen and tone the triceps, contributing to overall arm strength and aesthetics. Among the exercises that work the arm muscles, kickback and its variations are very effective. You can easily apply these exercises with dumbbells, cables or resistance bands.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wide-pull-up",
    "name": "Wide Pull Up",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "The grip width for a wide grip pull-up is typically wider than shoulder-width apart, which means your hands will be positioned farther apart than they would be for a standard pull-up. This wider grip targets the latissimus dorsi muscles more effectively, making it an excellent exercise for building upper body strength, particularly in the back muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "tuck-l-sit",
    "name": "Tuck L-sit",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [
      "Chest",
      "Quads",
      "Triceps"
    ],
    "highlight": [
      "abs",
      "biceps",
      "chest",
      "quads",
      "upperBack",
      "triceps"
    ],
    "view": "front",
    "description": "The tuck L-sit is a bodyweight hold where you support yourself on parallel bars, parallettes, or the floor with straight arms while pulling your knees toward your chest. Your hips stay lifted, your spine stays tall, and your feet hover off the ground. The goal is to keep your core tight, shoulders depressed, and arms locked out while maintaining the tucked position. It’s a core-intensive, shoulder-stabilizing static hold often used as a progression toward the full L-sit.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "archer-pull-up",
    "name": "Archer Pull Up",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps",
      "upperBack"
    ],
    "view": "back",
    "description": "An archer pull-up is an advanced bodyweight exercise that strengthens your back and biceps, serving as a progression towards a one-arm pull-up. It gets its name from the \"bow-drawing\" position your body takes at the top.Here's how to do it:1. Grip: Grasp a pull-up bar with a wider-than-shoulder-width overhand grip.2. Starting Position: Hang with arms fully extended, engaging your core and keeping your shoulder blades pulled down.3. The Pull: Pull your body up towards one hand, similar to a regular pull-up. At the same time, extend the other arm out to the side, keeping it as straight as possible. Your chin should come towards the hand that is pulling.4. Hold &amp; Lower: Briefly hold the top position where one arm is bent and pulling, and the other is extended. Slowly lower yourself back to the starting position with control.5. Alternate: Repeat the movement, pulling up towards the opposite hand.The key to this exercise is to keep the assisting arm as straight as possible to maximise the load on the working arm. This makes it a challenging but effective exercise for unilateral pulling strength.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "larsen-press",
    "name": "Larsen Press",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Put your legs up on a separate Bench and press with no leg drive",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bulgarian-squat-with-dumbbells",
    "name": "Bulgarian Squat with Dumbbells",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "The Bulgarian split squat consists of performing a squat on one leg with the rear foot resting on a raised platform. Elevating your back leg on a bench creates instability and increases the range of motion of the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "stair-master",
    "name": "Stair Master",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "cardio and lower-body strength machine designed to simulate climbing stairs. It provides a low-impact, high-intensity workout that targets the legs, glutes, and core while improving cardiovascular endurance.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "elevaci-n-lateral-polea",
    "name": "Elevación lateral polea",
    "equipment": "Machine",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Lateral elevation unilateral using a polea",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "butchers-block-stretch",
    "name": "Butchers Block Stretch",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats",
      "upperBack"
    ],
    "view": "back",
    "description": "Kneel down with the hands together Rest the elbows on a bench in front of you and lower the chest down Keep the elbows bent with good posture and hold",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "clap-push-up",
    "name": "Clap Push-UP",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Abs",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "abs",
      "triceps"
    ],
    "view": "front",
    "description": "The clap push-up is an explosive upper body movement that builds power and fast-twitch muscle strength. It adds a plyometric challenge to the traditional push-up by requiring the hands to leave the ground mid-rep. Start in a strong push-up position with your hands slightly wider than shoulder-width and core engaged Lower your body explosively and push off the ground with enough force to lift your hands. Quickly clap your hands together at chest level before returning them to the floor. Land with soft elbows to absorb the impact and immediately move into the next rep",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sleeper-stretch",
    "name": "Sleeper Stretch",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Lie on your side so that you are resting a little weight on your shoulder blade to keep it still Extend your arm to 90 degrees in front of you, resting on the floor/mat Lift your hand with your elbow so that your fingers point to the ceiling and your palm points towards your feet Keeping your elbow still, gently lower your palm toward the floor",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-up",
    "name": "Push-Up",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Abs",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "abs",
      "triceps"
    ],
    "view": "front",
    "description": "The push-up is a fundamental bodyweight exercise that targets the chest, arms, and shoulders while engaging the core for stability. It requires no equipment and is excellent for building upper body strength. Instructions: Start in a plank position with hands placed slightly wider than shoulder-width, feet together, and body in a straight line from head to heels. Engage your core and lower your body by bending your elbows, keeping them close to your body or flared slightly outward. Lower until your chest nearly touches the ground while maintaining a neutral spine. Push through your palms to return to the starting position, fully extending your arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "devil-s-press",
    "name": "Devil’s Press",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Hamstrings",
      "Lats",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "hamstrings",
      "lats",
      "abs",
      "triceps"
    ],
    "view": "front",
    "description": "The Devil’s Press is a hybrid movement combining a dumbbell burpee and a double dumbbell snatch. It’s a full-body, high-intensity exercise that develops strength, power, and metabolic conditioning. Start with a dumbbell in each hand and perform a burpee, letting your chest touch the ground while holding the dumbbells. Explosively jump your feet forward and swing the dumbbells between your legs. Drive the dumbbells overhead in one continuous motion, locking out your arms. Lower the dumbbells with control to return to the starting position and repeat",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bird-dog",
    "name": "Bird Dog",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [
      "Shoulders",
      "Glutes"
    ],
    "highlight": [
      "abs",
      "shoulders",
      "glutes"
    ],
    "view": "front",
    "description": "The Bird Dog is a core stability exercise that enhances balance, coordination, and spinal alignment. It’s a low-impact movement ideal for strengthening the posterior chain and improving overall functional control. Begin on all fours with hands under shoulders and knees under hips, keeping your spine neutral. Extend your right arm forward and left leg backward simultaneously, keeping hips square. Pause briefly at full extension while engaging your core and glutes. Return to the starting position and repeat on the opposite side",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ab-wheel",
    "name": "Ab wheel",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "Starting Position: Kneel on the floor with the ab wheel in front of you. Grip the Wheel: Hold the handles firmly. Roll Out: Slowly roll the wheel forward, extending your body while keeping your core tight. Return: Pull the wheel back towards your knees, maintaining tension in your core.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "schwimmen",
    "name": "Schwimmen",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "800m Schwimmen in 20 Minuten",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-dowel-shoulder-press",
    "name": "Standing Dowel Shoulder press",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Mobility - prone dowel press or standing dowel shoulder press alternating between front andback",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "snap-down",
    "name": "Snap Down",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Calves",
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "calves",
      "abs"
    ],
    "view": "back",
    "description": "Begin in a standing position with your arms up over your head and your toes pushing into the ground raising your heels up becoming as tall as you can. From this position, perform a small hop with both feet slightly coming off of the ground. As you land, bend your knees and begin to hinge forward at your hips absorbing the landing. Return to the starting position and repeat. You should feel the muscles in your lower body working. Start with your arms and knees fully straightened out. Keep a stable balance as you land and briefly hold that end position, don’t go too fast and become off balanced. Keep your chest up. For a detailed video on landing mechanics, click here: https://youtu.be/RThUCYRDyZw",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bretzel-stretch",
    "name": "Bretzel stretch",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings",
      "Lats",
      "Chest"
    ],
    "highlight": [
      "glutes",
      "hamstrings",
      "lats",
      "chest"
    ],
    "view": "back",
    "description": "How to Perform the Bretzel Stretch Starting Position: Lie on your back on a flat surface, such as a mat. Bend your knees and place your feet flat on the ground. Leg Positioning: Lift your right leg and cross it over your left leg, placing your right foot on the outside of your left knee. Your left leg should remain flat on the ground. Arm Positioning: Extend your left arm out to the side at shoulder height, keeping it straight. Use your right hand to gently pull your right knee towards the floor on the left side of your body. Stretching: As you pull your knee down, try to keep your left shoulder flat on the ground. You should feel a stretch in your hip, lower back, and possibly your chest. Hold the Position: Maintain this position for 20-30 seconds, breathing deeply and relaxing into the stretch. Switch sides and repeat the process.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hip-hinge",
    "name": "Hip hinge",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [
      "Calves",
      "Quads",
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "calves",
      "quads",
      "abs"
    ],
    "view": "back",
    "description": "Hip Hinge Exercise DescriptionThe hip hinge is a fundamental movement pattern that involves bending at the hips while keeping the spine neutral. It is commonly used in exercises like deadlifts, kettlebell swings, and good mornings. To perform a hip hinge: Starting Position: Stand with your feet hip-width apart and a slight bend in your knees. Hinge at the Hips: Push your hips back while maintaining a straight back. Your torso should lean forward, and your chest should stay up. Lowering Phase: Continue to hinge until your torso is nearly parallel to the ground, or until you feel a stretch in your hamstrings. Return to Standing: Drive through your heels and thrust your hips forward to return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bronco",
    "name": "Bronco",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Finess test for rugby.5 x shuttle runs of 20m, 40m, and 60m (20yd, 45yd, 65yd/far 45yd mark) Complete as fast as possible",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "perpendicular-unilateral-landmine-row",
    "name": "Perpendicular Unilateral Landmine Row",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Using a landmine attachment with the barbell running at 90 degrees to either side, hinge slightly at the hips and grip the barbell by the plate sleeve. Raise the barbell to chest height, with your upper arm parallel to the floor at the top of the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trap-press",
    "name": "Trap press",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Laying flat with arm pointing straight upwards, elbow fully extended, use only your shoulder to raise the weight as high as comfortable and back to rest.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-laying-interior-rotation",
    "name": "Side-laying interior rotation",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Laying on your side and using the arm closest to the bench, maintain a 90 degree bend at the elbow and allow the weight to fall towards the ground past the bench as low as comfortable. Bring the weight up using only rotation of the shoulder to the opposing shoulder.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "supine-press",
    "name": "Supine press",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Take a close grip and push perpendicular to the bench. Keep back flat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "march-or-jog-in-place",
    "name": "March or jog in place",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Abs",
      "Triceps"
    ],
    "highlight": [
      "hamstrings",
      "shoulders",
      "biceps",
      "abs",
      "triceps"
    ],
    "view": "back",
    "description": "Low-impact cardiovascular exercise that simulates running without moving, ideal for warming up, improving endurance, or training in small spaces.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "estiramiento-de-piernas-y-cadera",
    "name": "Estiramiento de piernas y cadera",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "hamstrings",
      "lats"
    ],
    "view": "back",
    "description": "Movimientos suaves para mejorar la flexibilidad de la parte inferior del cuerpo y liberar tensión en la cadera.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "estiramiento-de-brazos-y-cuello",
    "name": "Estiramiento de brazos y cuello",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "shoulders",
      "lats",
      "chest"
    ],
    "view": "front",
    "description": "Alivia tensiones en la parte superior del cuerpo, especialmente útil para personas con trabajo de oficina o posturas prolongadas.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "respiraci-n-profunda-de-pie-o-sentado",
    "name": "Respiración profunda (de pie o sentado)",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Técnica de respiración consciente para mejorar oxigenación, reducir el estrés y conectar con el momento presente.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "meditaci-n-guiada-o-libre",
    "name": "Meditación guiada o libre",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Ejercicio mental de atención plena (mindfulness) que ayuda a reducir ansiedad, mejorar el enfoque y el bienestar general.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "smith-machine-split-squat",
    "name": "Smith Machine Split Squat",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "The \"Smith Machine Split Squat\" is a strength exercise performed on the Smith machine, ideal for targeting the legs and glutes. It involves placing one foot forward and the other back, lowering the body until the front thigh is parallel to the ground while the bar slides vertically along the machine. This exercise helps improve stability, correct muscle imbalances, and reduces stress on the back, providing a safe environment for strength training.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pull-ups-neutral-grip",
    "name": "Pull-Ups (Neutral Grip)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Execution Pulling phase (concentric): Drive your elbows down and back, pulling your chest toward your hands. Keep your shoulders depressed and retracted (avoid shrugging). Focus on squeezing your lats and upper back at the top. Top position: Chin should clear or reach the level of your hands. Pause briefly and contract your lats hard.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-fly-standing",
    "name": "Reverse Fly Standing",
    "equipment": "Cable",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand with a good posture holding a cable in each hand opposite the machine Starting with the hands in front of your chest pull the arms out to your side into the shape of a T with the elbows nearly straight Slowly release the arms forward to the start Repeat with the arms moving into the shape of a Y Repeat with the arms in the shape of a W Repeat with the arms in the shape of an L by your side",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "horizontal-shoulder-flexion-stretch",
    "name": "Horizontal Shoulder Flexion Stretch",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Raise your arm out to the side, placing your hand on a wall or doorway beside you at shoulder height Turn your body away from your arm to stretch the chest, as far as is comfortable",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "jalon-caballero-unialteral",
    "name": "Jalon caballero unialteral",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Pull performed in knight's stance",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cat-cow",
    "name": "Cat-Cow",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "On all fours. Arch spine up (cat) then drop it down (cow). Breathe with movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "diamond-push-ups",
    "name": "Diamond push ups",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "triceps",
      "chest"
    ],
    "view": "back",
    "description": "Start: Get into a plank. Place hands close together under your chest so thumbs and index fingers form a diamond shape. Lower: Bend your elbows to lower your chest toward your hands. Keep your body straight. Push: Push back up until arms are fully extended. New note Keep elbows close to your body and core tight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-scaption",
    "name": "Dumbbell Scaption",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "upperBack",
      "shoulders"
    ],
    "view": "back",
    "description": "Starting position: Stand upright with your feet shoulder-width apart. Hold a dumbbell in each hand with a neutral grip (palms facing each other). Keep a slight bend in your elbows, shoulders relaxed and shoulder blades pulled back. Execution: Slowly raise the dumbbells forward and slightly to the side, at about a 30–45° angle from your body (between a front raise and a lateral raise). Lift until your arms are about shoulder height (do not go overhead). Pause for a second at the top and feel the activation in your shoulders and scapular stabilizers. Lower the dumbbells back down under control to the starting position. Breathing: Inhale as you lower the dumbbells. Exhale as you lift them. Common mistakes: Using dumbbells that are too heavy (causing jerky movements). Lifting above shoulder height (puts unnecessary stress on the shoulder joint). Arching the lower back instead of keeping the movement controlled at the shoulders. Purpose of the exercise: Activates the lower trapezius, serratus anterior, and scapular stabilizers. Helps correct posture and improve shoulder balance.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-curl-with-elastic",
    "name": "Leg curl with elastic",
    "equipment": "Cable",
    "primary": "Calves",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "calves",
      "hamstrings"
    ],
    "view": "back",
    "description": "Standing position: Place the band under your feet in the middle of your foot and grasp it with a hammer grip.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sliding-lateral-lunge",
    "name": "Sliding Lateral Lunge",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [
      "Calves"
    ],
    "highlight": [
      "hamstrings",
      "calves",
      "abs"
    ],
    "view": "back",
    "description": "Stand upright with your feet hip-width apart, holding a kettlebell close to your chest in goblet position. Place one foot on a slider, gliding disc, or towel. Keep your chest tall and core engaged. Slowly slide the foot outward to the side while bending the opposite knee, lowering your hips into a lateral lunge. Keep the working leg’s knee aligned with the toes and avoid letting it collapse inward. The non-working leg remains straight and slides smoothly along the floor. Push through the heel of the bent leg to return to the starting position while maintaining control of the kettlebell.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "copenhagen-adduction-exercise",
    "name": "Copenhagen Adduction Exercise",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes",
      "abs",
      "chest",
      "upperBack"
    ],
    "view": "back",
    "description": "Lie on your side with the elbow placed directly under the shoulder, similar to a side plank position. Place the upper leg on a bench with the inside of the foot or ankle resting on it. Lift your hips and hold your body in a straight line while keeping the lower leg off the floor. The exercise strongly activates the adductors of the upper leg while also challenging the core and hip stabilizers.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "arm-raises-t-y-i",
    "name": "Arm Raises (T/Y/I)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "abs"
    ],
    "view": "front",
    "description": "Stand upright with feet hip-width apart, core engaged, and arms relaxed at your sides. From this position, perform three different arm raises to target the shoulders and upper back: T Raise: Lift your arms straight out to the sides until they are parallel to the floor, forming a “T” shape. Y Raise: Lift your arms upward at about a 45° angle from your body to form a “Y” shape. I Raise: Raise your arms straight overhead, close together, forming an “I” shape. Maintain a neutral spine, avoid arching your lower back, and move slowly with control. Focus on squeezing your shoulder blades together and keeping your shoulders down away from your ears.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "typewriter-pull-ups",
    "name": "Typewriter Pull-ups",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps",
      "upperBack"
    ],
    "view": "front",
    "description": "Hang from a pull-up bar with an overhand grip, slightly wider than shoulder-width. Pull yourself up until your chin is above the bar. At the top position, instead of going straight down, shift your body to one side by extending one arm while keeping the other arm bent. Move smoothly from one side to the other, like a typewriter motion, before lowering yourself back down. This exercise increases time under tension and strengthens the lats, biceps, and shoulders while building unilateral pulling strength.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bodyweight-biceps-curl",
    "name": "Bodyweight Biceps Curl",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Set up under a straight bar (around waist or chest height). Grip the bar with your palms facing you (supinated grip), hands about shoulder-width apart. Lean back with straight arms so that your body is at an angle to the ground. Keeping your elbows high and close to the bar, pull your upper body toward the bar by flexing your elbows, similar to a biceps curl. Lower yourself back down in a controlled manner. Keep your core tight and movement slow to maximize tension on the biceps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "glute-kickback-machine",
    "name": "Glute Kickback (Machine)",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Drive through your heel, not your toes, to hit the glute. Don’t hyperextend your lower back at the top.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-adduction-cable",
    "name": "Standing Adduction (Cable)",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Keep your hips square and still, pulling the cable across your opposing leg using only your inner thigh. Don’t let your torso lean or twist — no side bending to help the rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-row-machine",
    "name": "Seated Row (Machine)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "upperBack"
    ],
    "view": "back",
    "description": "Keep your chest up and squeeze your shoulder blades at the end. Don’t hunch forward or round your back during the pull.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kettlebell-sumo-deadlift",
    "name": "kettlebell sumo deadlift",
    "equipment": "Dumbbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Place your feet wider than shoulder-width apart, pointing your toes outward. Keep your back straight, shoulders back, and chest up. The knees must follow the same direction as the toes and not move forward. When going up, it is advisable to contract your glutes to maximize the effectiveness of the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rubber-band-glute-kickback",
    "name": "rubber band glute kickback",
    "equipment": "Cable",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "A rubber band glute kickback is an exercise performed on hands and knees, where you anchor a resistance band to your foot and kick your heel back and up, squeezing your glute at the top of the movement, while maintaining a stable core and flat back to target and strengthen the gluteal muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "treadmill-cardio",
    "name": "Treadmill Cardio",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "It's a cardiovascular workout performed on a treadmill to improve endurance, burn calories, and promote heart health. It offers multiple benefits, such as the ability to easily adjust speed and incline, allowing for a variety of workouts, from hill walking to high-intensity interval training (HIIT) and tempo runs. To optimize results, it's important to vary your workouts. Benefits of Treadmill Cardio: Improved Cardiovascular Health: Regular aerobic exercise on a treadmill strengthens the heart and lungs, which can help prevent heart disease. Weight Loss: By burning calories, treadmill training can be an effective tool for weight loss and maintaining a healthy weight. Muscle Strengthening: It strengthens the muscles in the legs and glutes, helping to prevent muscle loss, which is especially important with age. Training Flexibility: Allows you to vary speed, incline, and intervals, making your workout more dynamic and adaptable to different fitness levels. Types of Treadmill Training: Hill Walking: Increasing the incline of the treadmill and walking at a brisk pace can improve endurance and work your leg muscles. Endurance Jog: A run at a comfortable, steady pace that keeps your heart rate in a target zone (such as Zone 2) to build endurance. Interval Training: Alternating periods of high intensity (fast running) with periods of low intensity (easy walking or jogging) to maximize calorie burn and cardiovascular improvement. Tempo Run: A run at a steady, sustained pace that is slightly faster than a normal jog, which challenges your ability to sustain a more intense effort for an extended period.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "patada-de-burro-con-mancuerna",
    "name": "Patada de burro con mancuerna",
    "equipment": "Dumbbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "La patada de burro con mancuerna es un ejercicio efectivo para trabajar los músculos de los glúteos y los isquiotibiales. Este ejercicio se realiza generalmente en una posición de cuatro patas, utilizando una mancuerna para aumentar la resistencia. A continuación, se describen los pasos para realizarlo correctamente. Posición Inicial: Colócate en una posición de cuatro patas sobre una colchoneta, con las manos alineadas con los hombros y las rodillas alineadas con las caderas. Colocación de la Mancuerna: Toma una mancuerna y colócala detrás de la rodilla de la pierna que vas a levantar. Asegúrate de que esté bien sujeta para evitar que se caiga durante el ejercicio. Ejercicio: Inhala y, al exhalar, levanta la pierna con la mancuerna hacia arriba, manteniendo la rodilla flexionada en un ángulo de 90 grados. Eleva la pierna hasta que esté paralela al suelo, sintiendo la contracción en los glúteos. Mantén la posición durante un segundo en la parte superior y luego baja lentamente la pierna a la posición inicial. Repeticiones: Realiza de 10 a 15 repeticiones por cada pierna, asegurándote de mantener una buena forma durante todo el ejercicio. Series: Completa de 2 a 3 series, dependiendo de tu nivel de condición física.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cardio-en-bicicleta-est-tica",
    "name": "Cardio en bicicleta estática",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Beneficios del Cardio en Bicicleta Estática El cardio en bicicleta estática es una excelente forma de ejercicio que ofrece múltiples beneficios para la salud y el bienestar. Aquí te detallo algunos de los más destacados: Mejora de la Salud Cardiovascular Fortalece el corazón: El ejercicio regular ayuda a mejorar la eficiencia del corazón y a reducir el riesgo de enfermedades cardiovasculares. Aumenta la circulación: Mejora el flujo sanguíneo, lo que puede ayudar a reducir la presión arterial. Quema de Calorías y Pérdida de Peso Eficiente para quemar calorías: Dependiendo de la intensidad, puedes quemar entre 400 y 600 calorías por hora. Ayuda en la pérdida de peso: Combinado con una dieta equilibrada, el cardio en bicicleta estática puede ser efectivo para perder peso. Fortalecimiento Muscular Tonifica las piernas: Trabaja principalmente los músculos de las piernas, incluyendo cuádriceps, isquiotibiales y pantorrillas. Mejora la resistencia muscular: Con el tiempo, puedes aumentar la resistencia y la fuerza en las piernas. Beneficios para la Salud Mental Reduce el estrés: El ejercicio libera endorfinas, que pueden mejorar tu estado de ánimo y reducir el estrés. Aumenta la energía: La actividad física regular puede aumentar tus niveles de energía y mejorar la calidad del sueño.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "straight-arm-pulldown-cable",
    "name": "Straight-Arm Pulldown (Cable)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Keep arms straight but not locked, pulling with your lats, not your shoulders. Don’t let your shoulders shrug up during the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-dumbbell-calf-raise",
    "name": "Seated Dumbbell Calf Raise",
    "equipment": "Dumbbell",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "The seated dumbbell calf raise is a targeted exercise for strengthening the lower leg muscles. It follows the same movement pattern as the machine version: you place the weight on your knees, and by extending and flexing your ankles, you move the weight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-straight-arm-pulldown-cable",
    "name": "Side Straight-Arm Pulldown (Cable)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Keep your torso still, pulling the handle down along your side using the outer lat. Don’t twist your body or rotate your torso to cheat the rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-internal-rotation-cable",
    "name": "Shoulder Internal Rotation (Cable)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Keep your elbow tucked to your side like it's superglued there. Don’t rotate your torso — only your forearm should move.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-external-rotation-cable",
    "name": "Shoulder External Rotation (Cable)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Keep elbow fixed at your side and rotate forearm outward smoothly. Don’t let your wrist or elbow drift upward — stay in one plane.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-lateral-raise-cable",
    "name": "Side Lateral Raise (Cable)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Lift with your elbows leading, not your hands. Don’t shrug your shoulders; keep traps quiet.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-raise-cable",
    "name": "Front Raise (Cable)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Raise the handle in a slight arc with controlled movement. Don’t swing your torso to start the rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "face-pulls-with-yellow-green-band",
    "name": "Face pulls with yellow/green band",
    "equipment": "Cable",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats",
      "upperBack"
    ],
    "view": "back",
    "description": "Face pulls with band – standing horizontal pull. Grab the band at face height, pull elbows high and wide towards your face while squeezing shoulder blades together. Trains upper back, rear shoulders and improves posture.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "isometric-squat-to-failure",
    "name": "Isometric Squat to Failure",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "sometric Squat to Failure: A Strength Training Technique Definition The isometric squat to failure is a variation of the squat exercise where you hold a static squat position at a specific angle, maintaining the position until your muscles can no longer sustain the contraction.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-leg-lunge-with-kettlebell",
    "name": "Single-Leg Lunge with Kettlebell:",
    "equipment": "Dumbbell",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "How to do a single-leg kettlebell lunge Preparation: Stand with your feet together. Hold the kettlebell with both hands by the handle, keeping it close to your chest, or hold it with one hand (on the same side as the working leg). Step and Lower: Take a large step forward (or backward, which is safer for your knees) with one leg, lowering your hips until both knees form a 90-degree angle. Focus: Shift your weight onto your front (or bent) leg, keeping your back straight and your torso upright. Return: Push off with your front leg to return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-leg-side-glute-press",
    "name": "Single-leg side glute press",
    "equipment": "Machine",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "The Single-Leg Side Glute Press is a leg press machine variation where you angle your body sideways on the pad, placing one foot high and slightly angled to press the weight, powerfully targeting the outer glute (gluteus medius/minimus) and hamstrings for balanced leg development and stability, requiring focus on pushing through the heel and maintaining control without locking out. How to Perform: Setup: Sit in the leg press machine, rotate your body to one hip, placing one foot high on the platform at about a 45-degree angle with toes pointed slightly out/forward. Positioning: Keep your hip, knee, and ankle aligned, and ensure your lower back stays on the pad. Descent: Slowly lower the weight, allowing your knee to bend deeply (near 90 degrees), feeling a stretch in your glute and hamstring. Press: Drive through your heel (not your toes) to press the weight back up, squeezing your glutes and hamstrings, stopping just before your leg fully extends. Control: Avoid bouncing and don't let your lower back lift off the pad; maintain tension throughout the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "assisted-chin-ups",
    "name": "Assisted chin-ups",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Chin-ups with machine assistance (counterweights)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "neutral-grip-pull-ups-or-trx-rows",
    "name": "Neutral-grip pull-ups or TRX rows",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps"
    ],
    "view": "back",
    "description": "Pull-Up: Vertical Pull — Focuses more on the Lats (back width). TRX Row: Horizontal Pull — Focuses more on the Rhomboids/Traps (mid-back thickness and posture).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shrimp-squad",
    "name": "Shrimp Squad",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Single leg squad where one leg is behind you.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "l-sit-pull-ups",
    "name": "L-Sit Pull-ups",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "L-Sit Pull-ups train both upper body and core muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "back-lever",
    "name": "Back Lever",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Hanging from a pull-up bar facing downwards with your arms extended",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "windshield-wipers",
    "name": "Windshield Wipers",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Hang from a pull-up bar, raise your legs to the ceiling. Move lower body from left to right with straight legs like a windshield wiper",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "machine-side-lateral-raises",
    "name": "Machine Side Lateral Raises",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Machine side lateral raises are an isolation exercise for the side (lateral) deltoids, performed on a machine for stability, targeting the outer shoulder by lifting pads or handles out to the sides to shoulder height, then lowering slowly, keeping elbows slightly bent and traps down to focus on the delts. This exercise helps build shoulder width by preventing swinging and providing constant tension, making it great for beginners or as a finisher. How to Perform Machine Lateral Raises Setup: Adjust the seat so your shoulders align with the machine's pivot point, your chest is against the pad (or back if facing out), and your arms are at a 90-degree angle with the pads/handles. Starting Position: Grip the handles with a relaxed grip, elbows slightly bent, and shoulders down (depressed) away from your ears. Lifting Phase: Exhale and lift your arms out to the sides, moving your upper arms laterally, until they are parallel to the floor. Peak Contraction: Pause briefly at the top, squeezing the side delts, but don't shrug your shoulders up. Lowering Phase: Inhale and slowly lower the weight back down with control, resisting the weight on the way down.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-front-raise-with-a-small-bar",
    "name": "Cable Front Raise with a small bar",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "The Cable Front Raise with a small bar isolates your anterior deltoids (front shoulders) by providing constant tension, requiring you to stand facing away from a low pulley, grab the bar with an overhand grip, and lift it in front of you to shoulder height with slightly bent arms, avoiding swinging and keeping your core tight for controlled movement up and down. Use a light-to-moderate weight, focusing on slow, controlled reps to feel the muscle work, not momentum. How to Perform the Cable Front Raise (Bar) Setup: Attach a small straight bar to a low cable pulley. Set the weight to a light or moderate setting. Starting Position: Stand with your back to the machine, holding the bar with an overhand grip (palms facing down) at hip level, arms extended but not locked. Feet shoulder-width apart, core braced, shoulders back and down. The Lift: Exhale and slowly raise the bar straight up in front of you, keeping a slight bend in your elbows, until your hands reach shoulder height (or slightly below). The Hold: Pause briefly at the top, squeezing your front delts. The Lower: Inhale as you slowly and controllably lower the bar back to the starting position, maintaining tension.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "floor-dumbbell-bench-press",
    "name": "Floor dumbbell bench press",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "This exercise involves lying on your back with a dumbbell in each hand, and pressing them up towards the ceiling, targeting the chest muscles. The dumbbells are then lowered back down to the starting position on the floor.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "smith-machine-squat",
    "name": "Smith machine squat",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Technique and Execution The Smith machine squat is a variation of the traditional barbell squat that uses a guided, fixed-path barbell. Here's a detailed breakdown of the proper technique: Starting Position Foot Placement: Position feet slightly forward of the bar, about shoulder-width apart Bar Position: Rest the bar on your upper trapezius/shoulders, similar to a traditional back squat Stance: Feet can be slightly angled outward for natural hip rotation Squat Movement Unrack the bar by rotating it to release from the safety hooks Slowly lower your body by bending knees and hips Descend until thighs are parallel to the ground (or slightly below) Pause briefly at the bottom of the movement Drive through your heels to return to the starting position Benefits and Considerations Advantages Reduced Balance Requirements: Fixed bar path makes it easier for beginners Controlled Movement: Less risk of improper form compared to free weight squats Isolation: Allows focused leg muscle development",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-triceps-press",
    "name": "Seated Triceps Press",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Machine Setup Adjust the seat height so that the machine's handles align with your elbow joint Ensure your back is firmly supported against the backrest Feet should be flat on the floor Maintain a neutral spine position Movement Mechanics Starting Position Grip the handles with a neutral grip Keep upper arms close to your body Elbows bent at approximately 90 degrees Press Movement Extend arms forward by pushing the handles away Focus on using triceps to drive the movement Avoid using shoulder or chest muscles Fully extend arms without locking elbows Return Phase Slowly return to the starting position Maintain controlled, smooth motion Keep tension on the triceps throughout",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "romanian-deadlift",
    "name": "Romanian Deadlift",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "This exercise involves holding a dumbbell in each hand and bending forward at the hips while keeping the back straight, then returning to a standing position. It primarily targets the hamstrings and glutes.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-pull-through",
    "name": "Cable pull through",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings",
      "Calves",
      "Quads"
    ],
    "highlight": [
      "glutes",
      "hamstrings",
      "calves",
      "quads"
    ],
    "view": "back",
    "description": "The Cable Pull Through is a lower-body exercise that targets the glutes and hamstrings using a \"hip hinge\" motion. To perform it, attach a rope to the lowest pulley setting, face away from the machine with the rope between your legs, and step forward to create tension. Keeping your back flat and knees slightly soft, push your hips backward as if trying to close a door behind you until you feel a deep stretch in your hamstrings. To finish the rep, explosively drive your hips forward to return to a standing position, squeezing your glutes hard at the top. It is vital to remember that this is not a squat; your knees should not bend deeply, and your arms should remain straight and relaxed, acting only as hooks for the rope. This movement provides constant tension on the glutes while placing less stress on the lower back than a traditional deadlift.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-lateral-raise-front-cable",
    "name": "Side lateral raise - Front (Cable)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "in a cablerack do a side lateral raise with cable in front of you, with focus in tension on the back of your shoulder.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-lateral-raise-back-cable",
    "name": "Side lateral raise - Back (Cable)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "on a cable rack do a side lateral raise with the cable behind you. focus on tension in the front of the shoulder.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "45-lateral-raises",
    "name": "45° lateral raises",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "dumbbell raise in the space between front and side raises",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-y-pull-cable",
    "name": "Shoulder Y-pull cable",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "on a cable rack cross the cables and pull elbows to ceiling close to the body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "supino",
    "name": "supino",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Colocar a barra em linha reta ao peito e descer ate atingir 90 graus",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "plank-reach",
    "name": "Plank Reach",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Position your body in plank position, keeping your eyes on the ground. Raise one arm in front of you and return it. Repeat with the other arm. Raise and return slowly while keeping your body as still as possible.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bicep",
    "name": "bicep",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Não se encontra uma descrição disponível",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cabel",
    "name": "cabel",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Não se encontra uma descrição disponível",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-machine-row",
    "name": "Seated machine row",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "A seated row machine is a gym apparatus for strength training the back (lats, rhomboids, traps) by pulling handles toward the torso from a seated position, featuring adjustable seats and chest pads for proper form, emphasizing upright posture and squeezing shoulder blades, crucial for posture and back thickness, and distinct from a cardio rowing machine.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-crunch",
    "name": "Reverse crunch",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Lay down Place your hands near your butt (often slightly in front or under or both) Raise your legs, but about 70% of the way you should be able to also raise your pelvis (optional/variable) Hold 1/2 seconds at the top Go back to starting position",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "legend-incline-bench-press",
    "name": "Legend Incline Bench Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "incline bench press on LeverEdge machine.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-leg-deadlift-with-dumbbell",
    "name": "Single-Leg Deadlift with Dumbbell",
    "equipment": "Dumbbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Starting Position: Stand upright with a slight bend in your knees, holding a dumbbell in one or both hands. Shift your weight onto your supporting leg (e.g., your right leg) and lift your non-supporting foot slightly off the floor. The Hinge: Keeping your back flat and core engaged, hinge at your hips, pushing your glutes backward. As your torso lowers, extend your non-supporting leg straight back behind you for balance, keeping your hips square to the floor. The dumbbell(s) should lower toward the ground along the line of your supporting leg. Range of Motion: Continue lowering your torso until it is nearly parallel to the floor, or you feel an intense stretch in your supporting hamstring, ensuring your back remains neutral throughout the movement. Return to Start: Pause at the bottom, then contract your glutes and hamstrings to slowly raise your torso back to the starting position. Your non-supporting leg should return in line with the supporting one. Switch Sides: After completing your desired number of repetitions on one side, switch your weight and repeat the movement on the other leg.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-leg-glute-bridge",
    "name": "Single Leg Glute Bridge",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "A glute bridge, where you use just one leg at a time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "machine-hip-abduction",
    "name": "Machine Hip Abduction",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Technique and Execution Starting Position Seated Positioning: Sit in the machine with back against the pad Leg Placement: Inner thighs against the machine's padded resistance points Adjust Machine: Set seat position to align your hip joint with the machine's pivot point Movement Technique Start with legs together or slightly pressed against the inner pads Slowly push legs outward, spreading them apart Move until maximum comfortable lateral range is reached Pause briefly at the outer point of the movement Slowly return to the starting position with controlled movement Biomechanical Breakdown Muscle Engagement Primary Activation: Gluteus Medius (side hip muscle) Stabilization: Engages core and lower back muscles Functional Movement: Mimics lateral leg movement used in walking, sports, and daily activities Benefits Strength and Stability Improves Hip Stability Reduces Risk of Knee Injuries Enhances Lateral Movement Capabilities Targets Often-Neglected Muscle Groups",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wrist-curl-cable",
    "name": "Wrist curl, cable",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "biceps"
    ],
    "view": "back",
    "description": "Extend your arm down, then slightly lift your forearm Extend your wrist in a supinated form (palm up) Adjust cable height so that the cable handle is in your supinated hand Perform the movement by curling your palms and wrists upwards (optional/variable) Pause at the top Slowly return to the starting position",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "chair-dips",
    "name": "Chair dips",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit down on the front edge of a chair, back straight, hands holding the front edge. Still holding the edge of the chair, arms extended, lift your butt and walk forward slightly so that it is a few inches from the chair. Steps: Slowly lower your body, keeping the back straight, until your arms are at a right angle. Raise your body again to the initial position, arms extended. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pec-deck-rear-delt-fly",
    "name": "Pec deck rear delt fly",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Seated rear delt fly on pec deck machine (facing the machine and extending arms backwards, the hands should be at the height of the shoulders)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-squat",
    "name": "Barbell squat",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "abs"
    ],
    "view": "back",
    "description": "Stand with your feet shoulder-width apart and the barbell resting securely on your upper back (not your neck), gripping it slightly wider than shoulder-width. Keep your chest up, back straight, and core engaged. Begin the movement by bending at your hips and knees, lowering your body as if sitting back into a chair. Continue descending until your thighs are at least parallel to the ground (or slightly below if mobility allows). Keep your knees aligned with your toes and your weight evenly distributed through your heels. Push through your heels to return to the starting position, extending your hips and knees until you are standing tall again.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "deficit-push-ups",
    "name": "Deficit Push ups",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Pushup on blocks or grips, so you can dip lower than the hands in the decent.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "butterfly-stretch",
    "name": "Butterfly Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Sit in a prayer position with the soles of your feet gently pressed together. Use your hands to slowly pull your feet inwards towards your groin. Hold for as long as required.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "frog-stretch",
    "name": "Frog Stretch",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Get on your hands and knees. Widen your knees outwards, and drop to your elbows. Without moving your elbows or knees, start to rock forwards and backwards, trying to get your bum closer to your feet.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "supino-inclinado",
    "name": "Supino inclinado",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Inclinado 90 graus e movimentos leves e precisos",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "landmine-rotation",
    "name": "Landmine Rotation",
    "equipment": "Barbell",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Start with landmine barbell straight up by using your shoulders to push it up above you. Then, from that position, bring it your side to target your abdominals and return to starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "unilateral-cross-body-cable-pull-down",
    "name": "unilateral cross body cable pull down",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "on a cable rack place cable high, and with a straight arm pull that cable across you from high to low. focus on tension in back shoulder.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trap-bar-squat",
    "name": "Trap Bar Squat",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "quads",
      "hamstrings"
    ],
    "view": "front",
    "description": "A combination of squat and deadlift principles with the use of a hex/trap bar, easing stress on the lower back by better centering the weight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ankle-dorsiflexion-rocks",
    "name": "ankle dorsiflexion rocks",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Move your knee forward, keeping your heel on the ground. Hold the position for a couple of seconds and return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lat-pull-down",
    "name": "Lat Pull Down",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps",
      "chest",
      "upperBack"
    ],
    "view": "back",
    "description": "The lat pull down is an exercise used to build the muscles of the back. While the exercise will primarily target the lats, you will also notice a fair amount of bicep and middle back activation.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "parallel-bar-hold",
    "name": "Parallel Bar Hold",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Lats",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "lats",
      "abs"
    ],
    "view": "front",
    "description": "Stand between a set of parallel bars. Place your hands, knuckles outwards, on the bars. Push down on your hands to lift yourself off the floor. Hold yourself in this position with your arms straight for the required time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-hyperextension",
    "name": "Reverse Hyperextension",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Lie face-down on a bench with your legs hanging off the edge. Bend your hips so your thighs are vertical, bending your knees at the same time so your shins stay horizontal. Straighten out your legs so they are not bent and your toes are pointing backwards horizontally. Return to the original position, and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sphinx",
    "name": "Sphinx",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Lie on your stomach flat, legs extended and the backs of your feet on the ground. Bring your forearms under your shoulders, elbows directly underneath. Then press your hands into the floor to lift your chest. Draw your shoulder blades together, open your collarbones, and direct your gaze forward, while keeping the lower back relaxed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "open-book",
    "name": "Open Book",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Basic exercise Focus: enhances thoracic mobility and spinal segmentation while opening the shoulders and chest. **Position:**kneeling on the floor with your right side facing a wall. Hips are square and stable, with the right knee down and the left foot forward. Lengthen your spine and align your head comfortably. Begin with your arms relaxed and open in front of your chest, palms facing each other and hands apart. Inhale to initiate the movement, allowing your left arm —the one farther from the wall— to open outward and backward. Lead the twist from your thoracic spine, rotating your upper back progressively while keeping your pelvis still. Exhale as you complete the rotation, guiding your left hand toward the wall as your gaze follows your hand. Return by inhaling and slowly bringing your arm forward, reversing the spinal rotation segment by segment. Repeat on the opposite side. Progression **Position:**kneeling on the floor with your right side facing a wall. Left knee down and right foot forward. Before the basic exercise: inhale, exhalewhile moving the right arm along the wall with a circle upwards and backwards, inhalewhile bringing back the arm. Basic exercise. Repeat on the opposite side.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbell-tate-press",
    "name": "Dumbell Tate Press",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [
      "Shoulders",
      "Chest"
    ],
    "highlight": [
      "triceps",
      "shoulders",
      "chest"
    ],
    "view": "back",
    "description": "Set Up: Lie flat with a dumbbell in each hand. Extend your arms straight up over your chest as if you were at the top of a dumbbell bench press Starting Position: Position the dumbbells so they are touching or very close together with a pronated grip (palms facing your feet and thumbs facing each other) Lowering: Without moving your upper arms or shoulders, bend your elbows and flare them outward to the sides. Lower the inner ends of the dumbbells toward the center of your chest Touch and Pause: Gently touch the dumbbells to your chest. Do not rest the weight on your body; maintain constant tension in your triceps Press: Forcefully extend your elbows to return the dumbbells to the starting position. Focus on \"pushing your pinkies toward the sky\" to maximize triceps engagement https://www.youtube.com/watch?v=IgSjoXbpy1M&amp;t=2",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "chest-supported-rear-delt-raise",
    "name": "Chest-Supported Rear Delt Raise",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "\"The Y\"Position: Set an incline bench to 30-45 degrees. Lie face-down with your chest supported, keeping your head neutral or looking slightly down to avoid neck strain.Grip: Hold light dumbbells with a neutral or thumbs-up grip (thumb pointing to the ceiling).Movement: With straight or slightly bent elbows, raise the dumbbells up and out in a \"Y\" shape. Focus on moving the shoulders and shoulder blades rather than just lifting the arms.Top Position: Squeeze the shoulder blades together and reach high, ensuring the arms are angled to form a \"Y\".Control: Lower the dumbbells slowly to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "band-pull-apart-with-external-rotation",
    "name": "Band pull-apart with external rotation",
    "equipment": "Cable",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand tall with your feet shoulder-width apart, chest out, and shoulders back. Hold the resistance band with both hands, palms facing up or facing each other, depending on the band type. Bend your elbows at a 90-degree angle and glue your upper arms to your sides. The band should have some tension in the starting position, with your hands closer together in front of your stomach. Rotate Outward: While keeping your elbows tucked into your sides, slowly move your hands away from each other, stretching the band. Squeeze: Squeeze your shoulder blades together and down as you rotate your hands outward. Range of Motion: Rotate your hands as far outward as you comfortably can without allowing your elbows to leave your sides. Hold: Hold the end position for 1–2 seconds to maximize muscle engagement. Return: Slowly and with control, bring your hands back to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "double-leg-abdominal-press",
    "name": "Double-Leg Abdominal Press",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Lie on your back with knees and hips bent at 90 degrees (tabletop). Place your hands on your thighs just above your knees. Push your hands against your knees as hard as possible while using your abs to pull your knees toward your hands. Hold for 10 seconds of maximum effort. Your abs should be shaking.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "abdominal-draw-in",
    "name": "Abdominal Draw-In",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Lie on your back with knees bent. Gently pull your belly button toward your spine without moving your hips or holding your breath.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "landmine-squat-to-press",
    "name": "Landmine Squat to Press",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Hamstrings",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "hamstrings",
      "abs"
    ],
    "view": "front",
    "description": "Bar Position: Anchor one end of a barbell in a landmine attachment or a secure corner. Stance: Stand facing the barbell with feet slightly wider than shoulder-width. Turn your toes out 10–35 degrees to allow for better pelvic movement and depth. Grip: Cup the free end of the barbell with both hands (fingers interlaced or overlapping) and hold it at mid-chest level, just below the collarbone. Descent: Brace your core and sit back into a squat, keeping your chest up and weight on your heels. Depth: Lower until your thighs are at least parallel to the floor. A good reference is when your elbows touch the tops of your thighs or just inside your knees. Posture: Ensure your back remains flat and your spine neutral throughout the movement. Drive: Powerfully drive through your heels to stand up. Use the momentum from your legs to \"thrust\" the weight upward. Extension: In one fluid motion, press the bar overhead until your arms are fully extended. At the top, your biceps should be near your ears. The \"Lean\": As you reach the top of the press, lean slightly forward into the bar to encourage proper upward rotation of the shoulder blades and avoid lower back arching. Slowly lower the barbell back to chest height in a controlled manner before immediately beginning the next repetition.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-step-back-lunge",
    "name": "Barbell Step Back Lunge",
    "equipment": "Barbell",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "Step 1: Stand with your feet hip-width apart, holding a barbell on your upper back. Step 2: Keep your back straight, chest up, and core engaged. Step 3: Take a step back with one leg and lower your body by bending both knees. Ensure that your back knee nearly touches the ground. Step 4: Push off your back foot to return to the starting position. Step 5: Repeat the movement with the other leg. Continue alternating between legs for the desired repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hammerstrength-decline-chest-press",
    "name": "Hammerstrength Decline Chest Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Sit upright in a hammerstrength decline chest press machine while squeezing your shoulder blades together and placing your heels firmly on the ground underneath your knees. The back pad should be contact with your head, shoulders, and butt at all times. Grab ahold of the handles with an overhand grip just outside shoulder-width apart just below your chest. Keeping your core braced by breathing into your stomach and flexing the abdominal muscles, push through your palms to extend your elbows while keeping them at a 45 degree angle from your torso. Once your arms are fully extended, return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ring-support-hold",
    "name": "Ring Support Hold",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Hold yourself in a support position on gymnastic rings with arms straight at sides. Focus on keeping rings turned out slightly and maintaining hollow body position. This is an isometric hold for chest, shoulders, and triceps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "floor-glider-hamstring-curls",
    "name": "Floor Glider Hamstring Curls",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Lie on back with heels on floor gliders or towels. Lift hips into a bridge, then slide heels toward glutes while keeping hips elevated. Slowly return to the starting position while maintaining the hip bridge.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "trap-3-raise",
    "name": "Trap-3 Raise",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Hinge forwards and bend your knees slightly. Depress and retract the shoulder you will use. Rest the other hand on your knee. Raise your hand about 15 degrees overhead, maintaining the position of your shoulder.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "external-rotation-stretch",
    "name": "External Rotation Stretch",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Sit with your feet pressed against each other, and one knee raised all the way out to the side of your body. Place your elbow on your raised knee, bend it at 90 degrees, and point your hand directly forward, holding your barbell/dumbbell. Keep your shoulder depressed and retracted, raise your hand until your forearm is vertical, as if you were about to wave at someone like a robot. Lower your hand to the original position and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "banded-shoulder-drills",
    "name": "Banded Shoulder Drills",
    "equipment": "Cable",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Attach a resistance band to something solid behind you. Stand away from it, holding it in your hand so it is taut. See the attached youtube video: https://www.youtube.com/watch?v=zdwEWchSjrI .",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "solo-hip-flexor-stretch",
    "name": "Solo Hip Flexor Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "See this instructive video: https://www.youtube.com/watch?v=qHwyBHS6MQs .",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-leg-hamstring-stretch",
    "name": "Bent-Leg Hamstring Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "See this instructional video from Stretch Therapy: https://www.youtube.com/watch?v=CrF2iMnn09w .",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-shoulder-extension-stretch",
    "name": "Seated Shoulder Extension Stretch",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Sit with your hands behind you, shoulder width apart. Lock your elbows. Scoot your feet and hips out forwards, lowering your shoulders down towards ground. Go as far as possible to obtain a good stretch. See the video: https://www.youtube.com/watch?v=ihUAbG0e8zw",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "horse-stance-side-splits",
    "name": "Horse Stance (Side Splits)",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Stand as for a squat, with your feet wide and your toes pointed slightly outwards. Gently squat into a deep, wide squat - your hips should be below your knees. Hold for 3 to 5 seconds. Come up under control, and repeat as needed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calves-foam-roller",
    "name": "Calves foam roller",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Move your calves slowly over the foam roller",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hamstring-foam-roller",
    "name": "Hamstring Foam roller",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Move your hamstrings slowly over the foam roller",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "foam-roller-anterior-tibialis",
    "name": "Foam Roller Anterior tibialis",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Use the foam roller slowly in the tibial anterioris. This is english, please",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "foam-roller-iliotibial-band",
    "name": "Foam Roller Iliotibial band",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "Slide on the Foam Roller over your iliotibial band. Is english terrible checker",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "foam-roller-quadriceps",
    "name": "Foam Roller quadriceps",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "Slide the Foam Roller over your quadriceps. Is english, please",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "foam-roller-gluteus",
    "name": "Foam Roller Gluteus",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Slide on the Foam Roller over your gluteus. Is english please",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "foam-roller-adductors",
    "name": "Foam Roller Adductors",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Slide the Foam Roller over your Adductors. Is english please",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-stretch",
    "name": "Side stretch",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hip-circles",
    "name": "Hip Circles",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hip-crossover",
    "name": "Hip Crossover",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ankle-roll",
    "name": "Ankle Roll",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "banded-ankle-mobility",
    "name": "Banded Ankle Mobility",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hip-flexor-stretch",
    "name": "Hip Flexor Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lunge-with-twist-stretch",
    "name": "Lunge with Twist Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-figure-four-stretch",
    "name": "Lying Figure Four Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-hamstring-stretch-with-band",
    "name": "Lying Hamstring Stretch with Band",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lying-knee-to-chest-stretch",
    "name": "Lying Knee to Chest Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pigeon-stretch",
    "name": "Pigeon Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "quad-stretch",
    "name": "Quad Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "runners-lunge-stretch",
    "name": "Runners Lunge Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-it-band-stretch",
    "name": "Standing IT Band Stretch",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "supported-calf-stretch",
    "name": "Supported Calf Stretch",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "View the video to undestand the exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "banded-scapular-retraction",
    "name": "Banded Scapular Retraction",
    "equipment": "Cable",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Attach one end of resistance band to wall/upright/... at shoulder height. Insert arm into the loop, at the tricep. Step back until band is pulled straight. Pull back elbow and shoulder against the resistance of the band.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-db-y-raise",
    "name": "Incline DB Y-Raise",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Set an incline bench to a 45-degree angle and sit facing the bench, chest against the pad, with a dumbbell in each hand, palms facing each other. Position your feet firmly on the ground for stability and let your arms hang down naturally with a slight bend in your elbows. Engage your core and keep your back straight throughout the movement. Raise your arms forward and out to form a Y shape, keeping the movement controlled and your elbows slightly bent. Lift until your arms are roughly parallel to the floor and in line with your ears. Pause briefly at the top of the movement to engage your shoulder muscles fully, then slowly lower your arms back down to the starting position. Ensure the movement is slow and controlled during both the ascent and descent to maximize engagement of the deltoids and supporting muscles. Repeat for the desired number of repetitions, maintaining proper form throughout.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wide-grip-pull-up",
    "name": "Wide Grip Pull Up",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps",
      "upperBack"
    ],
    "view": "back",
    "description": "Using a pronated grip, grasp the pull bar with a wider than shoulder width grip. Take a deep breath, squeeze your glutes and brace your abs. Depress the shoulder blades and then drive the elbows straight down to the floor while activating the lats. Pull your chin towards the bar until the lats are fully contracted, then slowly lower yourself back to the start position and repeat for the assigned number of repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "db-wrist-extension",
    "name": "DB Wrist Extension",
    "equipment": "Dumbbell",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": ": Grab two dumbbells with an overhand grip and lay your forearms across your knees. : Let your wrists flex fully, then extend your wrists.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-cable-lateral-raise",
    "name": "High-Cable Lateral Raise",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "shoulders",
      "lats",
      "chest"
    ],
    "view": "front",
    "description": "Stand next to a cable machine with the pulley set to waist height. Grab the opposite-side handle with the hand farthest from the pulley, keeping your palm facing in. Keep your core engaged, chest lifted, and shoulders relaxed. Maintain a slight bend in the elbow throughout the lift. Lift your arm out to the side until your elbow reaches shoulder height, keeping your wrist aligned with your elbow. Briefly pause at the top, then slowly lower the handle back to your side with control. Repeat for the desired reps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "machine-chest-press",
    "name": "Machine Chest Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "biceps",
      "triceps"
    ],
    "view": "front",
    "description": "Adjust the seat height so that the grips are parallel to your chest. Use your legs to push the foot forward pedal. Bring the handles to the start position. Keep your back and the cushion in contact with the handles, press outwards. Press the handles away from your chest and exhale. Allow the handles to come in gently until they reach your chest. Allow the handles to return to your chest as you exhale.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "suitcase-carry",
    "name": "Suitcase Carry",
    "equipment": "Dumbbell",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Walk forward and backward with holding dumbbell on one side without leaning to counter the weight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-full-squat",
    "name": "Barbell Full Squat",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [
      "Calves",
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "calves",
      "abs"
    ],
    "view": "back",
    "description": "The barbell full squat is a compound exercise that targets multiple muscle groups in the lower body, including the quadriceps, hamstrings, and glutes. Proper form is crucial for maximizing results and preventing injuries during the barbell full squat. This includes maintaining a shoulder-width stance, creating whole body tension, controlling your descent, and maintaining proper depth and knee positioning. Assistance moves such as the front squat, goblet squat, split squat, and Bulgarian split squat can help improve your performance in the barbell full squat by targeting specific muscle groups and improving overall technique. To achieve new personal records in your back squat, gradually increase weight over time, vary rep ranges and sets to stimulate muscle growth, and prioritize rest and recovery between training sessions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "behind-the-back-cable-lateral-raise",
    "name": "Behind the Back Cable Lateral Raise",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders",
      "upperBack"
    ],
    "view": "front",
    "description": "Lateral raises have long been a staple for building capped delts, and lifters use everything from dumbbells and bands to machines and single-arm variations to make them grow.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "clamshell",
    "name": "Clamshell",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Position Side plank with the elbow and the forearm on the ground and the legs slightly bent. Execution Lift your upper knee while keeping your feet close together, like a “shell opening,” then slowly return to the starting position. Keep your core stable and your hips aligned.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "banded-clamshell",
    "name": "Banded Clamshell",
    "equipment": "Cable",
    "primary": "Glutes",
    "secondary": [
      "Quads"
    ],
    "highlight": [
      "glutes",
      "quads"
    ],
    "view": "back",
    "description": "Position Side plank with the elbow and the forearm on the ground and the legs slightly bent. Stretch a doubled-up resistance band between your thighs, just above the knee. Execution Lift your upper knee while keeping your feet close together, like a “shell opening,” then slowly return to the starting position. Keep your core stable and your hips aligned.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-pancake-good-morning",
    "name": "Standing Pancake Good Morning",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Stand with your feet wider than shoulder-width apart and toes pointed slightly outward. Place your hands on the back of your head. Hinge at your hips and lower your upper body towards the ground, keeping your back straight and chest open.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-pancake-good-morning",
    "name": "Seated Pancake Good Morning",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Sit with your legs completely straight (knees locked), spread wide in a straddle position. Place your hands on the back of your neck. Hinge your torso and head towards the floor.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shinbox-ir-stretch",
    "name": "Shinbox IR Stretch",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Starting Position: Sit on the floor with both hips and knees bent at 90-degree angles. Leg Placement: Place one leg in front of you (external rotation) and the other leg out to the side/behind you (internal rotation). The shins and knees should remain flat on the ground. The Movement: Keeping your hips square, hinge your torso forward or tilt it laterally (side-to-side) toward the front leg to deepen the stretch. Target Areas: Stretches the glutes and piriformis (front leg) and the hip flexors and quads (back leg). Engages the core and obliques during lateral flexion. Goal: Improves hip mobility, specifically internal and external rotation, and relieves lower back tension.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ytwl-exercise",
    "name": "YTWL Exercise",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Purpose: Improves shoulder stability, posture, and scapular (shoulder blade) control. Often used in physical therapy and warm-ups. Starting Position: Stand with feet shoulder-width apart. Hinge forward at the hips (like a deadlift) keeping your back flat, or lie face down on an incline bench. Keep your thumbs pointing up throughout. Y (Arms up): Extend both arms straight forward and upward at a 135-degree angle from your body, forming a \"Y\". Squeeze your shoulder blades together at the top. T (Arms out): Open your arms straight out to the sides, perpendicular to your body, forming a \"T\". Focus on pinching your shoulder blades. W (Arms bent): Pull your elbows back, bending them to 90 degrees, and squeeze your shoulder blades to form a \"W\". Keep your wrists firm. L (Arms rotated): Start with elbows bent at 90 degrees and close to your body. Rotate your forearms outward (external rotation) like a goalpost, forming an \"L\" or a gate. Key Focus: Movements should be slow and controlled. Always lead with the thumbs and think about moving the shoulder blades, not just the arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "supine-hip-abduction",
    "name": "Supine Hip Abduction",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Starting Position: Lie on your back (supine) on a mat, with your legs extended and relaxed. Arms can be placed alongside your body or out to the sides for stability. The Movement: Slightly lift one leg off the floor (keeping it straight or with a slight bend). Move it laterally outward, away from the other leg, as if stepping over a small obstacle. Range of Motion: Move the leg as far as comfortable without lifting your pelvis or rotating your torso, feeling a stretch in the inner thigh and hip. Return: Slowly bring the leg back to the starting position with controlled movement. Goal: Improves lateral hip mobility (abduction) and strengthens the pelvic stabilizer muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "neck-cars",
    "name": "Neck CARs",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Controlled Articular Rotations. Slow full circles 3 each way. Cervical mobility.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "floor-bench-press",
    "name": "Floor Bench Press",
    "equipment": "Dumbbell",
    "primary": "Triceps",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "triceps",
      "shoulders"
    ],
    "view": "back",
    "description": "Start: Lie on your back on the floor with knees bent. Hold weights above your chest with straight arms. Lower: Lower the weights until your upper arms touch the floor. Push: Press the weights back up to the starting position. New note (Notatka): Do not bounce your elbows off the floor. Control the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-snatch",
    "name": "dumbbell snatch",
    "equipment": "Dumbbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Key Steps to Execute Correctly: Setup: Place the dumbbell between your feet, with your shoulders above your hips, chest up, and back flat. The Pull: Explosively extend your hips, knees, and ankles (triple extension) to drive the dumbbell upward, keeping your elbow high and the dumbbell close to your body. The Catch: Quickly flex your hips and knees to drop under the dumbbell and receive it overhead with your arm locked in position, landing in a half-squat stance. Common Mistakes: Using your arms too much to lift the weight instead of your legs, having a low elbow during the pull phase, and misaligning your shoulder, elbow, and wrist in the final position. For beginners, it’s recommended to start with light loads, focus on technique, and perform 3 to 5 sets of 3 to 5 reps per arm.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "1-leg-box-squat",
    "name": "1 Leg Box Squat",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "This exercise requires a sturdy box or a chair. Simple stand ~6 inches in front of it and balance yourself on one leg. From here, begin squatting down in a smooth controlled motion while keeping your other leg straight out in front of you for balance. Slowly sit down on the box, pause for a 1 count and push back up with the working leg, while never letting your other leg touch the ground.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "overhead-barbell-press",
    "name": "Overhead Barbell Press",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Setup: Stand with feet together and grip the bar slightly wider than shoulders. Position: Rest the bar on your upper chest. Press: Brace your core and push the bar straight up until your arms lock out. Finish: Control the bar back down to your chest. https://youtu.be/ZXpdJOLNoWw?si=u27cGyODoblXHBu1",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "limber-11",
    "name": "Limber 11",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Limber 11 Source: Joe DeFranco 1. Foam Roll IT Band [soft_tissue] - 10-15 passes 2. Foam Roll Adductors [soft_tissue] - 10-15 passes 3. SMR Glutes (lax ball) [soft_tissue] - 30 sec-2 min 4. Bent-knee Iron Cross [dynamic] - 5-10 reps each side 5. Roll-overs into V-sits [dynamic] - 10 reps 6. Rocking Frog Stretch [dynamic] - 10 reps 7. Fire Hydrant Circles [dynamic] - 10 forward / 10 backward 8. Mountain Climbers [dynamic] - 10 reps each leg 9. Cossack Squats [dynamic] - 5-10 reps each side 10. Seated Piriformis Stretch [isometric] - 20-30 sec each side 11. Rear-foot-elevated Hip Flexor Stretch [dynamic + 3s hold] - 5-10 reps each side",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "close-grip-bench-press",
    "name": "Close-Grip Bench Press",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "triceps",
      "chest"
    ],
    "view": "back",
    "description": "Setup: Lie flat on the bench and grip the bar at shoulder-width (closer than a standard bench press). Descent: Lower the bar with control to your lower chest. Form: Keep your elbows tucked in tight against your torso—do not let them flare out. Ascent: Press the bar straight back up, squeezing your triceps at the top.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "tricep-rope-pushdowns",
    "name": "Tricep Rope Pushdowns",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [
      "Lats"
    ],
    "highlight": [
      "triceps",
      "lats"
    ],
    "view": "back",
    "description": "Setup: Stand facing the cable, feet shoulder-width apart, with a slight forward lean. Grip: Hold the rope with palms facing each other and elbows tucked tight to your ribs. Execution: Push the rope down until arms are fully straight, pulling the ends apart at the bottom. Control: Keep upper arms still and return to the start with a slow, controlled motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "clean-and-press",
    "name": "Clean and Press",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Quads"
    ],
    "highlight": [
      "shoulders",
      "quads"
    ],
    "view": "front",
    "description": "The First Pull: Lift the bar from the floor to knee-height by driving with the legs, keeping the angle of your back constant. The \"Power\" Position: As the bar reaches mid-thigh, explosively shrug and extend your hips to create vertical momentum. The Quick Elbow Turnover: In the catch phase, rotate your elbows rapidly under the bar to create a \"shelf\" on your front deltoids. The Vertical Press: Press the bar in a straight line; your head should shift slightly forward once the bar clears your forehead to reach full lockout.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "weighted-push-ups",
    "name": "Weighted push-ups",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Setup: Begin in a standard plank position with a weight plate balanced securely on your upper back. Alignment: Maintain a straight line from your head to your heels, engaging your core to prevent your back from sagging. Execution: Lower your body until your chest nearly touches the floor, keeping your elbows at a forty-five degrees. Ascent: Press through your palms to return to the starting position, fully extending your arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "walking-lunges",
    "name": "Walking Lunges",
    "equipment": "Cable",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "Starting Position: Stand with feet hip-width apart and hands either on your hips or holding dumbbells at your sides. The Stride: Take a wide step forward with your right leg. The Descent: Lower your hips until both knees are bent at approximately 90-degree angles. The Transition: Drive through your front heel to stand up, bringing your back foot forward to step directly into the next lunge.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pec-deck",
    "name": "Pec Deck",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Pectoral issolation exercise - full range of motion is best with full contraction and slow negative",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pullback",
    "name": "Pullback",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Set weight and grip for the cables in the cage. Take a few steps away, bend over, pull and extend the back at the same time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hip-bridge",
    "name": "Hip Bridge",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes",
      "abs"
    ],
    "view": "back",
    "description": "Get into bridge position, balance yourself on heels and start extending legs unilaterally. Keep hip extended as much as possible.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "unilateral-lunges",
    "name": "Unilateral Lunges",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "No stops during movement, hands on the hips.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "butterfly-superman",
    "name": "Butterfly Superman",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Lie on stomach, intertwine fingers behind the head and start raising your head and raise elbows as far as they go.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-wheel",
    "name": "Leg Wheel",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Lay on the back and lift legs in perpendicular fashion, keeping the knees together. Start making small circles in one direction with both of your knees with very small range of motion, focusing on abs and keeping your back in contact with the floor.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kneeling-superman",
    "name": "Kneeling Superman",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "abs"
    ],
    "view": "back",
    "description": "Push one foot back until leg fully extended, concentrating on the having the foot high and pushed back as if pulled. Extend arm forward with focus having the shoulder high up. Unilateral and static hold.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cat-plank",
    "name": "Cat Plank",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "quads",
      "shoulders"
    ],
    "view": "front",
    "description": "On your fours and raise the knees of the floor ever so slightly. Curl your back out and push back from your shoulders as to resemble a cat making itself look large.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "core-rotation",
    "name": "Core Rotation",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads",
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "Sit back, raise feet above the ground with knees bent and start rotating left and right with hands touching the ground every move.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "unilateral-hip-thrust",
    "name": "Unilateral Hip Thrust",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "glutes",
      "abs"
    ],
    "view": "back",
    "description": "Extend one leg while laying down and start raising your body with one leg touching the ground through the heel.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "isometria-alle-parallele",
    "name": "Isometria alle parallele",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "The parallel bars isometric hold is a static upper-body exercise performed on dip bars (parallel bars). Instead of moving up and down like in a traditional dip, you hold a fixed position under tension.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "quadruped-hip-abduction",
    "name": "Quadruped Hip Abduction",
    "equipment": "Cable",
    "primary": "Calves",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Distribute your body weight evenly on all knees and arms. Keep the torso stable, with the abdomen engaged and the lumbar spine straight without twisting the back (imagine: a glass on your lower back won't fall off). Raise one leg outwards without twisting it. Pay attention to the right angle at the hips and knees. Always train both sides of the body. To increase resistance, a resistance band can be used.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "tuck-planche",
    "name": "Tuck planche",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Chest",
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "abs",
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Basic calisthenics progression for the full planche",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "legend-chest-press",
    "name": "Legend Chest Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Plate-loaded chest press machine from Legend Fitness LeverEdge line.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "extreme-pec-stretch",
    "name": "Extreme Pec Stretch",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Deep loaded stretch for pectorals, typically performed at end of chest work.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "extreme-shoulder-stretch",
    "name": "Extreme Shoulder Stretch",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Deep loaded stretch for deltoids, performed after pressing movements.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "extreme-lat-stretch",
    "name": "Extreme Lat Stretch",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Deep loaded stretch for latissimus dorsi, performed after pulling movements.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-cable-chest-fly",
    "name": "Seated Cable chest fly",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Place a bench between two cable pulleys and adjust the pulleys so they are at chest/shoulder height when you are seated. Grab the handles with a neutral grip and lean against the upright backrest. Bring your arms together in front of your chest in a controlled motion, focusing on squeezing your chest muscles. Keep your elbows slightly bent throughout the movement. Pause briefly at the top position. Slowly lower your arms back to the starting position while maintaining control of the movement. Repeat for reps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "3008-abdominal-crunch",
    "name": "3008 Abdominal Crunch",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "This is especially for the gym80 device 3008 Abdominal Crunch.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-silverback-shrug",
    "name": "Barbell Silverback Shrug",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "Stand with your feet shoulder width apart holding the barbell with both hands in front just past shoulder width. Bend forward at the hips with a slight bend in your knees, keeping your back straight. Engage your shoulder blades, as if you are trying to touch them together. Release the shrug. Description taken from MuscleWiki",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "inverted-lat-pull-down",
    "name": "Inverted Lat Pull Down",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps",
      "Abs"
    ],
    "highlight": [
      "lats",
      "biceps",
      "abs",
      "chest"
    ],
    "view": "back",
    "description": "The Inverted Lat Pull Down (most commonly known as the Reverse Grip Lat Pull Down) is a variation of the standard exercise that uses an underhand (supinated) grip with hands at shoulder-width. This position shifts more emphasis to the lower lats and increases biceps involvement, often allowing for a greater range of motion and a deeper squeeze at the bottom of the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-v-grip-row",
    "name": "Seated V-Grip Row",
    "equipment": "Cable",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Abs"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps",
      "abs",
      "chest"
    ],
    "view": "back",
    "description": "The Seated V-Grip Row is a compound pulling exercise performed on a cable machine using a close-grip \"V\" handle. While seated with your feet braced, you pull the handle toward your midsection, focusing on back thickness and mid-back development.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "assisted-pull-up",
    "name": "Assisted Pull-Up",
    "equipment": "Cable",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps",
      "Abs"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps",
      "abs",
      "chest"
    ],
    "view": "back",
    "description": "The Assisted Pull-Up is a compound vertical pulling exercise performed on a machine with a counterweight platform or by using resistance bands. It mimics the mechanics of a standard pull-up but reduces the total weight you have to lift, making it an excellent tool for building functional strength and perfecting your technique.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-curl",
    "name": "Dumbbell Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [
      "Shoulders",
      "Abs"
    ],
    "highlight": [
      "biceps",
      "shoulders",
      "abs"
    ],
    "view": "front",
    "description": "The Dumbbell Curl is a classic isolation exercise for the arms. Unlike the Hammer Curl, it involves rotating your wrists (supination) as you lift the weights, which allows for a full contraction of the biceps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hammer-curl",
    "name": "Hammer Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [
      "Shoulders",
      "Abs"
    ],
    "highlight": [
      "biceps",
      "shoulders",
      "abs"
    ],
    "view": "front",
    "description": "The Hammer Curl is a popular isolation exercise for the arms, typically performed with dumbbells. Instead of rotating your wrists like a standard bicep curl, you keep a neutral grip (palms facing each other) throughout the entire movement, as if you were holding a hammer.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "abdominal-crunch",
    "name": "Abdominal Crunch",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "The Abdominal Crunch is a classic core isolation exercise performed on the floor or a mat. Unlike a full sit-up, it involves a smaller range of motion where you only lift your shoulders and upper back off the ground, keeping your lower back pressed firmly against the floor.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "belt-squat",
    "name": "Belt Squat",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "Belt Squat: a squat variation done with a belt attached to a loading machine or platform so the weight is supported at the hips instead of on the spine. It mainly trains the quads and glutes, with much less lower-back fatigue than a barbell squat. Use a full range of motion, keep the torso upright, and drive through the mid-foot.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "arnold-shoulder-press",
    "name": "Arnold Shoulder Press",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Very common shoulder exercise. As shown here: https://www.youtube.com/watch?v=vj2w851ZHRM",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-hack-squats",
    "name": "Barbell Hack Squats",
    "equipment": "Barbell",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Perform leg squats with barbell behind your legs",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-push-up",
    "name": "Dumbbell Push-Up",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Normal Push-ups on Dumbbells, this brings a further range of movement",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-lunges-standing",
    "name": "Barbell Lunges Standing",
    "equipment": "Barbell",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "Put barbell on the back of your shoulders. Stand upright, then take the first step forward. Step should bring you forward so that your supporting legs knee can touch the floor. Then stand back up and repeat with the other leg. Remember to keep good posture.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-lunges-walking",
    "name": "Barbell Lunges Walking",
    "equipment": "Barbell",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-triceps-extension",
    "name": "Barbell Triceps Extension",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [
      "Shoulders",
      "Chest"
    ],
    "highlight": [
      "triceps",
      "shoulders",
      "chest"
    ],
    "view": "back",
    "description": "Position barbell overhead with narrow overhand grip. Lower forearm behind upper arm with elbows remaining overhead. Extend forearm overhead. Lower and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-reverse-wrist-curl",
    "name": "Barbell Reverse Wrist Curl",
    "equipment": "Barbell",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Sitting on a bench, grab a barbell with your palms facing down and your hands shoulder-width apart. Rest your forearms on your thighs and allow your wrists to hang over your knees. Curl your knuckles towards your face, lifting the barbell. Pause for a moment in the top position, then slowly return the barbell to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lunges",
    "name": "Lunges",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand with back straight. Steps: Take a large step forward with your left leg. Bring your pelvis down until you almost touch the floor with your right knee. Bring your pelvis back up. Return to the starting position by stepping back. Repeat, switching legs each time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-split-squats-left",
    "name": "Side split squats left",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand tall and take a wide lateral stride, just greater than shoulder width. Steps: Bend one knee until your thigh is parallel to the floor. The bent knee must be in line with the foot. Push back to the starting position. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-split-squats-right",
    "name": "Side split squats right",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand tall and take a wide lateral stride, just greater than shoulder width. Steps: Bend one knee until your thigh is parallel to the floor. The bent knee must be in line with the foot. Push back to the starting position. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bulgarian-split-squats-left",
    "name": "Bulgarian split squats left",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Stand tall in front of a chair and take a large step. Put the upper part of one of your feet on the chair. Bend the front knee, balancing with arms until the back knee almost touches the ground. Push back to the starting position and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bulgarian-split-squats-right",
    "name": "Bulgarian split squats right",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Stand tall in front of a chair and take a large step. Put the upper part of one of your feet on the chair. Bend the front knee, balancing with arms until the back knee almost touches the ground. Push back to the starting position and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "split-squats-left",
    "name": "Split squats left",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand with your back straight. Take a large step forward with your left leg. Steps: Bring your pelvis down until you almost touch the floor with your right knee. Bring your pelvis back up. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "split-squats-right",
    "name": "Split squats right",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand with your back straight. Take a large step forward with your left leg. Steps: Bring your pelvis down until you almost touch the floor with your right knee. Bring your pelvis back up. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "forward-arm-circles",
    "name": "Forward arm circles",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand tall with your back straight. Steps: Keeping your arms straight, bring them in front of you, move them down, behind your back, then over your head, and back to the initial position. Keep circling your arms as described in step 1.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "backward-arm-circles",
    "name": "Backward arm circles",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand tall with your back straight. Steps: Keeping your arms straight, bring them in front of you, raise them over your head, then continue the motion behind your back and down to the initial position. Keep circling your arms as described in step 1.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-lunges",
    "name": "Reverse lunges",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Stand straight, feet hip-width apart. Steps: Step backward with one leg so it can bend comfortably to a 90 degree angle. Slowly bend both knees to form 90 degree angles. Return to the starting position. Repeat, alternating legs.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "high-plank",
    "name": "High plank",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Get into the high plank position:your hands and toes should be touching the ground, your back, arms and legs should be straight.To get to this position, you can lie down on your stomach, place your hands facing down next to your head, and lifting your arms up until they are straight. Steps: Maintain the starting position for the entire duration of the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "biceps-curls-with-dumbbell",
    "name": "Biceps Curls With Dumbbell",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold two barbells, the arms are streched, the hands are on your side, the palms face inwards. Bend the arms and bring the weight with a fast movement up. At the same time, rotate your arms by 90 degrees at the very beginning of the movement. At the highest point, rotate a little the weights further outwards. Without a pause, bring them down, slowly. Don't allow your body to swing during the exercise, all work is done by the biceps, which are the only mucles that should move (pay attention to the elbows).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-over-rowing",
    "name": "Bent Over Rowing",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps"
    ],
    "view": "back",
    "description": "Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position. Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause. Then inhale and slowly lower the barbell back to the starting position. Repeat for the recommended amount of repetitions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-over-dumbbell-rows",
    "name": "Bent Over Dumbbell Rows",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "With dumbbells in hand, bend at the hip until hands hang just below the knees (similar to straight-legged-deadlift starting position). Keep upper body angle constant while contracting your lats to pull you ellbows back pinching the shoulder blades at the top. Try not to stand up with every rep, check hands go below knees on every rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "biceps-curls-with-sz-bar",
    "name": "Biceps Curls With SZ-bar",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold the SZ-bar shoulder-wide, the back is straight, the shoulders slightly back, the arms are streched. Bend the arms, bringing the weight up, with a fast movement. Without pausing, let down the bar with a slow and controlled movement. Don't allow your body to swing during the exercise, all work is done by the biceps, which are the only mucles that should move (pay attention to the elbows).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bent-over-lateral-raises",
    "name": "Bent-over Lateral Raises",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Sit on bench while holding weights. Bend forward as far as possible, with arms slightly bent at the elbow. Perform a lateral raise while maintaining the bend in your elbow.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "benchpress-dumbbells",
    "name": "Benchpress Dumbbells",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "The movement is very similar to benchpressing with a barbell, however, the weight is brought down to the chest at a lower point. Hold two dumbbells and lay down on a bench. Hold the weights next to the chest, at the height of your nipples and press them up till the arms are stretched. Let the weight slowly and controlled down.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "biceps-curls-with-barbell",
    "name": "Biceps Curls With Barbell",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold the Barbell shoulder-wide, the back is straight, the shoulders slightly back, the arms are streched. Bend the arms, bringing the weight up, with a fast movement. Without pausing, let down the bar with a slow and controlled movement. Don't allow your body to swing during the exercise, all work is done by the biceps, which are the only mucles that should move (pay attention to the elbows).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "decline-bench-leg-raise",
    "name": "Decline Bench Leg Raise",
    "equipment": "Machine",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Setup: Lie on a decline bench with your head at the top and grip the handles. The Start: Extend legs fully, keeping them slightly elevated to engage your core. The Lift: Raise your legs toward the ceiling using your abs, not momentum. The Squeeze: Pause and contract your lower abdominals at the top. The Return: Lower your legs slowly to the starting position with control.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-rear-delt-fly-single-arm",
    "name": "Cable Rear-Delt Fly (single arm)",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Cable rear delt fly (single arm): Stand sideways to a cable machine with the handle set around shoulder height. With a slight bend in the elbow, pull the handle out and back in a wide arc so the upper arm moves away from the body. Keep your torso still and focus on the rear delt doing the work. Use light to moderate weight and controlled reps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wide-grip-pulldown",
    "name": "Wide-grip Pulldown",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps",
      "chest",
      "upperBack"
    ],
    "view": "back",
    "description": "Lat pulldowns with a wide grip on the bar.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bench-press",
    "name": "Bench Press",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Lay down on a bench, the bar should be directly above your eyes, the knees are somewhat angled and the feet are firmly on the floor. Concentrate, breath deeply and grab the bar more than shoulder wide. Bring it slowly down till it briefly touches your chest at the height of your nipples. Push the bar up. If you train with a high weight it is advisable to have a spotter that can help you up if you can't lift the weight on your own. With the width of the grip you can also control which part of the chest is trained more: wide grip: outer chest muscles narrow grip: inner chest muscles and triceps",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "bench-press-narrow-grip",
    "name": "Bench Press Narrow Grip",
    "equipment": "Barbell",
    "primary": "Triceps",
    "secondary": [
      "Shoulders",
      "Chest"
    ],
    "highlight": [
      "triceps",
      "shoulders",
      "chest"
    ],
    "view": "back",
    "description": "Lay down on a bench, the bar is directly over your eyes, the knees form a slight angle and the feet are firmly on the ground. Hold the bar with a narrow grip (around 20cm.). Lead the weight slowly down till the arms are parallel to the floor (elbow: right angle), press then the bar up. When bringing the bar down, don't let it down on your nipples as with the regular bench pressing, but somewhat lower.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "biceps-curl-with-cable",
    "name": "Biceps Curl With Cable",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Stand around 30 - 40cm away from the cable, the feet are firmly on the floor. Take the bar and lift the weight with a fast movements. Lower the weight as with the dumbbell curls slowly and controlled.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "one-arm-triceps-extensions-on-cable",
    "name": "One Arm Triceps Extensions on Cable",
    "equipment": "Bodyweight",
    "primary": "Arms",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-leg-extension",
    "name": "Single Leg Extension",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "forward-shoulder-rotation",
    "name": "Forward shoulder rotation",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight. Steps: Place your hands on your shoulders. Repeatedly rotate both shoulder joints in a circular motion at a moderate pace.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "backward-shoulder-rotation",
    "name": "Backward shoulder rotation",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight. Steps: Place your hands on your shoulders. Repeatedly rotate both shoulder joints in a circular motion at a moderate pace.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "left-neck-stretch",
    "name": "Left neck stretch",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight. Steps: Tilt your head to the side. Take the hand closer to your head and use it to grab your head from the other side. Push with your hand against your head and with your head against your hand so that the forces balance out and your head stays still. Maintain this tension until the end of the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "right-neck-stretch",
    "name": "Right neck stretch",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Sit or stand with your back straight. Steps: Tilt your head to the side. Take the hand closer to your head and use it to grab your head from the other side. Push with your hand against your head and with your head against your hand so that the forces balance out and your head stays still. Maintain this tension until the end of the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "cable-rear-delt-fly",
    "name": "Cable Rear Delt Fly",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "The reverse cable fly, also known as the cable rear delt fly, is a deltoid muscle strengthening and definition exercise. It’s one of the best isolation exercises for your back and posterior deltoid.This workout targets your posterior (back) deltoids while using a range of upper body muscles. Adjust the weight and the pulleys to the right height. You should be able to see the pulleys because they should be above your head. With your right hand, grab the left pulley, and with your left hand, grab the right pulley, crossing them in front of you. This is where you’ll begin your journey. Start the movement by moving your arms back and forth while keeping your arms straight. Pause at the finish of the move for a brief moment before returning the handles to their starting positions.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "seated-hip-adduction",
    "name": "Seated Hip Adduction",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Starting Position: Sit on the machine with your knees inward and against the pads. Pull the pin to release the pads. Grab the handles on the sides.b",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "abdominal-stabilization",
    "name": "Abdominal Stabilization",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "left-levator-scapulae-stretch",
    "name": "Left levator scapulae stretch",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start standing up or sitting down. Turn your head to the left, around 45 degrees or just above your nipple. Place your right hand behind your back or sit on it. Take your left hand and use it to hold the back of your head. Lean your head down slightly. Steps: After assuming the starting position, press your head against your left hand with slight force. Your hand should press back with equal force, so that your head doesn't move. Hold this position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "right-levator-scapulae-stretch",
    "name": "Right levator scapulae stretch",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start standing up or sitting down. Turn your head to the right, around 45 degrees or just above your nipple. Place your left hand behind your back or sit on it. Take your right hand and use it to hold the back of your head. Lean your head down slightly. Steps: After assuming the starting position, press your head against your right hand with slight force. Your hand should press back with equal force, so that your head doesn't move. Hold this position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "clockwise-neck-circles",
    "name": "Clockwise neck circles",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start sitting or standing. Drop your head down, bringing your chin toward your chest, but not pushing. Steps: In a slower fluid motion and with your head relaxed and not pushing in any direction: lean toward your right shoulder. then bring your head back, facing up. then lean toward your left shoulder.4.and back toward the starting position. Keep repeating this as part of one slower fluid motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "counterclockwise-neck-circles",
    "name": "Counterclockwise neck circles",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start sitting or standing. Drop your head down, bringing your chin toward your chest, but not pushing. Steps: In a slower fluid motion and with your head relaxed and not pushing in any direction: lean toward your left shoulder. then bring your head back, facing up. then lean toward your right shoulder.4.and back toward the starting position. Keep repeating this as part of one slower fluid motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "neck-half-circles",
    "name": "Neck half circles",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Start sitting or standing. Lean your head against one of your shoulders, but don't push. Steps: In one slower fluid motion and with your head relaxed and not pushing in any direction: bring your head down toward your chest. then lean back aganst your other shoulder. then back toward the chest again.4.and finally toward the starting position. Keep repeating this.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-plank-right",
    "name": "Side plank right",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Starting position: Lie down on your side, with your bottom elbow at a right angle, arm sticking out. Lift your pelvis off the floor by lifting your bottom shoulder up, keeping the forearm on the floor; your head, pelvis, and feet should be in a straight line. Steps: Hold this position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pistol-squats-right",
    "name": "Pistol squats right",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Stand on one leg, with your other leg straight and slightly forward. Bend one knee slowly, descending into a squat and keeping your back and your other leg straight. Slowly raise yourself from the squat, straightening the bent knee and keeping the other leg straight. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calf-raises-right-leg",
    "name": "Calf raises, right leg",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Stand on the floor or on the edge of a step to increase the range of movement. Raise one foot. Lift your heel until you're standing on your toes. (variable) Stay in this position for three seconds Slowly lower your foot until you almost touch the ground with your heel - don't slam your foot!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "glute-bridge",
    "name": "Glute Bridge",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "Lie on you back with your hips and knees flexed, feet on the ground. From this position, raise your butt off of the ground to a height where your body makes a straight line from your knees to your shoulders. To make the exercise more intense, you can add weight by letting a barbell rest on your hips as you complete the motion, or you can put your feet on a slightly higher surface such as a step or a bench.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "close-grip-lat-pull-down",
    "name": "Close-grip Lat Pull Down",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Grip the pull-down bar with your hands closer than shoulder width apart, with your palms facing away from you. Lean back slightly. Pull the bar down towards your chest, keeping your elbows close to your sides as you come down. Pull your shoulders back at the end of the motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "braced-squat",
    "name": "Braced Squat",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "Stand with feet slightly wider than shoulder-width apart, while standing as tall as you can. Grab a weight plate and hold it out in front of your body with arms straight out. Keep your core tight and stand with a natural arch in your back. Now, push hips back and bend knees down into a squat as far as you can. Hold for a few moments and bring yourself back up to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "barbell-wrist-curl",
    "name": "Barbell Wrist Curl",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "shoulders",
      "biceps",
      "abs"
    ],
    "view": "front",
    "description": "Sitting on a bench, grab a barbell with your palms facing up and your hands shoulder-width apart. Rest your forearms on your thighs and allow your wrists to hang over your knees. Perform the movement by curling your palms and wrists towards your face. Pause for a moment in the top position, then slowly return the barbell to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calf-press-using-leg-press-machine",
    "name": "Calf Press Using Leg Press Machine",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Put the balls of your feet on an extended leg press pad. Use your calves to press the weight by flexing your feet/toes into a pointed position, and releasing back into a relaxed position. This exercise builds mass and strength in the Gastrocnemius and Soleus muscles as well, if not better, than any calf exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calf-raises-on-hackenschmitt-machine",
    "name": "Calf Raises on Hackenschmitt Machine",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Place yourself on the machine with your back firmly against the backrest, the feet are on the platform for calf raises. Check that the feet are half free and that you can completely stretch the calf muscles down. With straight knees pull up your weight as much as you can. Go with a fluid movement down till the calves are completely stretched. Repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "butterfly-narrow-grip",
    "name": "Butterfly Narrow Grip",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "The movement is the same as with a regular butterfly, only that the grip is narrow: Sit on the butterfly machine, the feet have a good contact with the floor, the upper arms are parallel to the floor. Press your arms together till the handles are practically together (but aren't!). Go slowly back. The weights should stay all the time in the air.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ball-crunches",
    "name": "Ball crunches",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "butterfly",
    "name": "Butterfly",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Sit on the butterfly machine, the feet have a good contact with the floor, the upper arms are parallel to the floor. Press your arms together till the handles are practically together (but aren't!). Go slowly back. The weights should stay all the time in the air.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "crunches-on-machine",
    "name": "Crunches on Machine",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "The procedure is very similar as for regular crunches, only with the additional weight of the machine. Sit on the machine, put both feet firmly on the ground. Grab the to the weights, cables, etc. and do a rolling motion forwards (the spine should ideally lose touch vertebra by vertebra). Slowly return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-crunches",
    "name": "Incline Crunches",
    "equipment": "Machine",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Lay down on your back on a inclined bench, feet are on one end of the bench. Ask a partner or use some other help (barbell, etc.) to keep them fixed, your hands are behind your head. From this position move your upper body up till your head or elbows touch your knees. Do this movement by rolling up your back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "butterfly-reverse",
    "name": "Butterfly Reverse",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "crunches",
    "name": "Crunches",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "Lay down on your back a soft surface, the feet are on the floor. Ask a partner or use some other help (barbell, etc.) to keep them fixed, your hands are behind your head. From this position move your upper body up till your head or elbows touch your knees. Do this movement by rolling up your back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "crunches-with-legs-up",
    "name": "Crunches With Legs Up",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "On your back, legs extended straight up, reach toward your toes with your hands and lift your shoulder blades off the ground and back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "deficit-deadlift",
    "name": "Deficit Deadlift",
    "equipment": "Barbell",
    "primary": "Back",
    "secondary": [
      "Hamstrings",
      "Glutes",
      "Lats",
      "Abs"
    ],
    "highlight": [
      "hamstrings",
      "glutes",
      "lats",
      "abs",
      "calves"
    ],
    "view": "back",
    "description": "Preparation Stand on weight plate, bumper plate, or shallow elevated platform with loaded bar above feet. Squat down and grasp bar with shoulder width or slightly wider overhand or mixed grip. Execution Lift bar by extending hips and knees to full extension. Pull shoulders back at top of lift if rounded. Return weights to floor by bending hips back while allowing knees to bend forward, keeping back straight and knees pointed same direction as feet. Repeat. Comments Throughout lift, keep hips low, shoulders high, arms and back straight. Knees should point same direction as feet throughout movement. Keep bar close to body to improve mechanical leverage. Grip strength and strength endurance often limit ability to perform multiple reps at heavy resistances. Gym chalk, wrist straps, grip work, and mixed grip can be used to enhance grip. Mixed grip indicates one hand holding with overhand grip and other hand holding with underhand grip. Lever barbell jack can be used to lift barbell from floor for easier loading and unloading of weight plates. Barbell Deficit Deadlift emphasizes building strength through lowest portion of Deadlift. Target muscle is exercised isometrically. Heavy barbell deadlifts significantly engages Latissmus Dorsi. See Barbell Deficit Deadlift under Gluteus Maximus. Also see Deadlift Analysis.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "flutter-kicks",
    "name": "Flutter Kicks",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "-Laying on the back, lift your straightened legs from the ground at a 45 degree angle. -As your Left foot travels downward and nearly touches the floor, your Right foot should seek to reach a 90 degree angle, or as close to one as possible. -Bring your R foot down until it nearly touches the floor, and bring your L foot upwards. Maintain leg rigidity throughout the exercise. Your head should stay off the ground, supported by tightened upper abdominals. -(L up R down, L down R up, x2) ^v, v^, ^v, v^ = 1 rep -Primarily works the Rectus Abdominus, the hip flexors and the lower back. Secondarily works the Obliques. Emphasis placed on the lower quadrant of the abs.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "deadlifts",
    "name": "Deadlifts",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "lats",
      "glutes"
    ],
    "view": "back",
    "description": "Stand firmly, with your feet slightly more than shoulder wide apart. Stand directly behind the bar where it should barely touch your shin, your feet pointing a bit out. Bend down with a straight back, the knees also pointing somewhat out. Grab the bar with a shoulder wide grip, one underhand, one reverse grip. Pull the weight up. At the highest point make a slight hollow back and pull the bar back. Hold 1 or 2 seconds that position. Go down, making sure the back is not bent. Once down you can either go back again as soon as the weights touch the floor, or make a pause, depending on the weight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "diagonal-shoulder-press",
    "name": "Diagonal Shoulder Press",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "You sit at the bench press device, back slightly tilted to the back. The bar should be about 20 cm in front of you. Then you push the bar and take it back again, as you would with a bench press. In this position you strain your chest muscles a lot less, which is nice if you want to train, but your chest hasn't recovered yet. Here's a link to a girl on a machine specialized for this exercise, to give a better description than my failing words above. http://www.schnell-online.de/db_imgs/products/img/t-80400.jpg",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-goblet-squat",
    "name": "Dumbbell Goblet Squat",
    "equipment": "Dumbbell",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "Grasp dumbbell with both hands at the sides of the upper plates. Hold dumbbell in front of chest, close to torso. Place feet about shoulderwide apart, keep knees slightly bent. Squat down until thighs are parallel to floor. Keep back straight, bend and move hips backward to keep knees above feet. Return, keep knees slightly flexed. Repeat. Keep bodyweight on heels and look ahead or slightly above to keep back straight.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "decline-bench-press-barbell",
    "name": "Decline Bench Press Barbell",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Lay down on a decline bench, the bar should be directly above your eyes, the knees are somewhat angled and the feet are firmly on the floor. Concentrate, breath deeply and grab the bar more than shoulder wide. Bring it slowly down till it briefly touches your chest at the height of your nipples. Push the bar up.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "decline-bench-press-dumbbell",
    "name": "Decline Bench Press Dumbbell",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Take two dumbbells and sit on a decline bench, the feet are firmly on the floor, the head is resting the bench. Hold the weights next to the chest, at the height of your nipples and press them up till the arms are stretched. Let the weight slowly and controlled down.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-lunges-standing",
    "name": "Dumbbell Lunges Standing",
    "equipment": "Dumbbell",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": ".",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "decline-pushups",
    "name": "Decline Pushups",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "With your feet raised approximately 30cm on a platform, align your shoulders, elbows and hands, then perform regular pushups. This emphasises the clavicular fibers of the pectoralis major.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "fly-with-cable",
    "name": "Fly With Cable",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-lunges-walking",
    "name": "Dumbbell Lunges Walking",
    "equipment": "Dumbbell",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "Take two dumbbells in your hands, stand straight, feet about shoulder wide. Take one long step so that the front knee is approximately forming a right angle. The back leg is streched, the knee is low but doesn't touch the ground. \"Complete\" the step by standing up and repeat the movement with the other leg.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "fly-with-dumbbells-decline-bench",
    "name": "Fly With Dumbbells, Decline Bench",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "The exercise is the same as with a regular bench: Take two dumbbells and lay on a bench, make sure the feet are firmly on the ground and your back is not arched, but has good contact with the bench. The arms are stretched in front of you, about shoulder wide. Bend now the arms a bit and let them down with a half-circle movement to the side. Without changing the angle of the elbow bring them in a fluid movement back up.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "fly-with-dumbbells",
    "name": "Fly With Dumbbells",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Take two dumbbells and lay on a bench, make sure the feet are firmly on the ground and your back is not arched, but has good contact with the bench. The arms are stretched in front of you, about shoulder wide. Bend now the arms a bit and let them down with a half-circle movement to the side. Without changing the angle of the elbow bring them in a fluid movement back up.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-incline-curl",
    "name": "Dumbbell Incline Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Setup: Set an adjustable bench to an incline of approximately 45 to 60 degrees. Starting Position: Sit back against the bench with a dumbbell in each hand. Let your arms hang straight down toward the floor with your palms facing forward (supinated grip). The Curl: Keeping your upper arms stationary and shoulders pinned back against the bench, exhale and curl the weights upward toward your shoulders. Peak Contraction: Squeeze your biceps hard at the top of the movement, ensuring your elbows do not swing forward. The Descent: Inhale and slowly lower the dumbbells back to the starting position, maintaining full control and feeling the stretch in the biceps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-triceps-extension",
    "name": "Dumbbell Triceps Extension",
    "equipment": "Dumbbell",
    "primary": "Triceps",
    "secondary": [
      "Shoulders",
      "Chest"
    ],
    "highlight": [
      "triceps",
      "shoulders",
      "chest"
    ],
    "view": "back",
    "description": "Position one dumbbell over head with both hands under inner plate (heart shaped grip). With elbows over head, lower forearm behind upper arm by flexing elbows. Flex wrists at bottom to avoid hitting dumbbell on back of neck. Raise dumbbell over head by extending elbows while hyperextending wrists. Return and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dips",
    "name": "Dips",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "A dip is an upper-body strength exercise. Narrow, shoulder-width dips primarily train the triceps, with major synergists being the anterior deltoid, the pectoralis muscles (sternal, clavicular, and minor), and the rhomboid muscles of the back (in that order).[1] Wide arm training places additional emphasis on the pectoral muscles, similar in respect to the way a wide grip bench press would focus more on the pectorals and less on the triceps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dips-between-two-benches",
    "name": "Dips Between Two Benches",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Put two benches so far appart, that you can hold onto one with your hands and are just able to reach the other with your feet. The legs stay during the exercise completely stretched. With your elbows facing back, bend them as much as you can. Push yourself up, but don't stretch out the arms.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-raises-with-plates",
    "name": "Front Raises with Plates",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hanging-leg-raises",
    "name": "Hanging Leg Raises",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Hanging from bar or straps, bring legs up with knees extended or flexed",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-raises",
    "name": "Front Raises",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "To execute the exercise, the lifter stands with their feet shoulder width apart and weights or resistance handles held by their side with a pronated (overhand) grip. The movement is to bring the arms up in front of the body to eye level and with only a slight bend in the elbow. This isolates the anterior deltoid muscle (front of the shoulder) and uses the anterior deltoid to lift the weight. When lifting it is important to keep the body still so the anterior deltoid is fully utilised; if the weight cannot be lifted by standing still then it is too heavy and a lower weight is needed. It is important to keep a slight bend in the elbow when lifting as keeping the elbow locked will add stress to the elbow joint and could cause injury. A neutral grip, similar to that used in the hammer curl, can also be used. With this variation the weight is again raised to eye level, but out to a 45 degree angle from the front of the body. This may be beneficial for those with shoulder injuries, particularly those related to the rotator cuff.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hindu-squats",
    "name": "Hindu Squats",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "Start with your feet shoulder width apart and arms slightly behind your back. As you descend towards the floor, raise your heels off the ground, while keeping your back as vertical as possible. Upon attaining the bottom position, touch the hands to the heels. Then stand up ending with the heels on the ground, arms extended in front of the chest then rowing into the start position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-squats",
    "name": "Front Squats",
    "equipment": "Barbell",
    "primary": "Glutes",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "glutes",
      "abs"
    ],
    "view": "back",
    "description": "This variation of the squat trains the hamstrings and gluteus maximus. It also works the back extensors and abductors.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hammercurls-on-cable",
    "name": "Hammercurls on Cable",
    "equipment": "Bodyweight",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Take a cable in your hands (palms parallel, point to each other), the body is straight. Bend the arms and bring the weight up with a fast movement. Without any pause bring it back down with a slow, controlled movement, but don't stretch completely your arms. Don't swing your body during the exercise, the biceps should do all the work here. The elbows are at your side and don't move.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "hammer-curls",
    "name": "Hammer Curls",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Start: Hold dumbbells at your sides with palms facing your torso. Curl: Lift the weights toward your shoulders while maintaining the neutral grip (like holding a hammer). Squeeze: Contract the biceps at the top without moving your elbows forward. Lower: Slowly return to the starting position with full control.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "skullcrusher-dumbbells",
    "name": "Skullcrusher Dumbbells",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Hold the dumbbells and lay down on a flat bench in such a way that around 1/4 of your head is over the edge. Stretch arms straight up and then lean dumbbells away from your toes to a 10-20 degree angle. Keep upper arm at this angle throughout exercise. Dumbbell shall not be amed at your head, but away over your head. This will maximise gain from exercise with load on triceps all the time. Pay attention to your elbows and arms: only the triceps are doing the work, the rest of the arms should not move.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "skullcrusher-sz-bar",
    "name": "Skullcrusher SZ-bar",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Hold the SZ-bar and lay down on a flat bench in such a way that around 1/4 of your head is over the edge. Stretch your arms with the bar and bend them so that the bar is lowered. Just before it touches your forehead, push it up. Pay attention to your elbows and arms: only the triceps are doing the work, the rest of the arms should not move.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-pull-narrow",
    "name": "Front Pull narrow",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "front-pull-wide",
    "name": "Front pull wide",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "handstand-pushup",
    "name": "Handstand Pushup",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "The handstand push-up (press-up) - also called the vertical push-up (press-up) or the inverted push-up (press-up) also called commandos- is a type of push-up exercise where the body is positioned in a handstand. For a true handstand, the exercise is performed free-standing, held in the air. To prepare the strength until one has built adequate balance, the feet are often placed against a wall, held by a partner, or secured in some other way from falling. Handstand pushups require significant strength, as well as balance and control if performed free-standing.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-curls-laying",
    "name": "Leg Curls (laying)",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Lay on a bench and put your calves behind the leg holder (better if they are hold on around the lower calves). Hold a grip on the bars to make sure the body is firmly in place. Bend your legs bringing the weight up, go slowly back. During the exercise the body should not move, all work is done by the legs.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lat-pull-down-leaning-back",
    "name": "Lat Pull Down (Leaning Back)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Lean Back, Pull into chest",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lat-pull-down-straight-back",
    "name": "Lat Pull Down (Straight Back)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Pull bar down to strenum and keep straight back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-curls-sitting",
    "name": "Leg Curls (sitting)",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lateral-rows-on-cable-one-armed",
    "name": "Lateral Rows on Cable, One Armed",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Set cable at waist height, start with arm across your belly and move han over and out too other side, one arm at the time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lateral-raises",
    "name": "Lateral Raises",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "This exercise works the deltoid muscle of the shoulder. The movement starts with the arms straight, and the hands holding weights at the sides or in front of the body. Body is in a slight forward-leaning position with hips and knees bent a little. Arms are kept straight or slightly bent, and raised through an arc of movement in the coronal plane that terminates when the hands are at approximately shoulder height. Weights are lowered to the starting position, completing one rep. When using a cable machine the individual stands with the coronal plane in line with the pulley, which is at or near the ground.[9] The exercise can be completed one shoulder at a time (with the other hand used to stabilize the body against the weight moved), or with both hands simultaneously if two parallel pulleys are available.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-curl",
    "name": "Leg Curl",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "The leg curl, also known as the hamstring curl, is an isolation exercise that targets the hamstring muscles. The exercise involves flexing the lower leg against resistance towards the buttocks. Other exercises that can be used to strengthen the hamstrings are the glute-ham raise and the deadlift.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "lateral-to-front-raises",
    "name": "Lateral-to-Front Raises",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "-(1) Perform a lateral raise, pausing at the top of the lift (2). -Instead of lowering the weight, bring it to the front of your body so that you appear to be at the top position of a front raise. You will do this by using a Pec Fly motion, maintaining straight arms. (3) -Now lower the weight to your quadriceps, or, in other words, lower the dumbbells as though you are completing a Front Raise repetition. (4) -Reverse the motion: Perform a front raise (5), at the apex of the lift use a Reverse Fly motion to position the weights at the top of a Lateral Raise (6), and finally, lower the weights until your palms are essentially touching the sides of your thighs (7). THIS IS ONE REP. (1) l front view(2) -l- FV (3) l- side view (4) l SV/FV (5) l- SV (6) -l- FV (7) l FV/SV",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-push-up",
    "name": "Incline Push up",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "chest",
      "hamstrings"
    ],
    "view": "front",
    "description": "Regular push with a 30 degree incline.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "squats-on-multipress",
    "name": "Squats on Multipress",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-dumbbell-fly",
    "name": "Incline Dumbbell Fly",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Use inclined bench. Hold dumbbells straight out to your sides, elbows slightly bent. Bring arms together above you, keeping angle of elbows fixed.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-plank-with-alternate-floor-touch",
    "name": "Incline Plank With Alternate Floor Touch",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Perform the plank with legs elevated, feet on a gymball. Once stabilised, slowly move one foot sideways off the ball, then make it touch the floor, then come back to starting position. Alternate with the other foot. This is a core exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kettlebell-swings",
    "name": "Kettlebell Swings",
    "equipment": "Dumbbell",
    "primary": "Glutes",
    "secondary": [
      "Hamstrings"
    ],
    "highlight": [
      "glutes",
      "hamstrings"
    ],
    "view": "back",
    "description": "Hold the kettlebell securely in both hands. Keep your back flat throughout the move, avoiding any rounding of the spine.Keeping your knees \"soft\", hinge your hips backwards, letting the kettlebell swing between your knees. You want to bend from the hips as far as you can without letting your back round forwards. Then, snap your hips forwards quickly and standing up straight, locking your body in an upright posture. The speed you do this will cause your arms and the kettlebell to swing up in front of you. Don't try to lift the kettlebell with your arms. The snapping forwards of your hips will cause the kettlebell to swing forwards through momentum. Depending on the weight of the kettlebell and the speed of your hip movement, your arms will swing up to about shoulder height. At the top of this swing, let your hips hinge backwards again as the kettlebell swings back down to between your legs and the start of the next repetition.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leverage-machine-iso-row",
    "name": "Leverage Machine Iso Row",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Adjust seat height so that the handles are at the bottom of your pectorals or just below.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "negative-crunches",
    "name": "Negative Crunches",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Sit yourself on the decline bench and fix your legs. Cross your arms over the chest and bring with a rolling movement your upper body up, go now without a pause and with a slow movement down again. Don't let your head move during the exercise.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "military-press-mit-sz-bar",
    "name": "Military Press mit SZ-Bar",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "On an SZ-bar grip your hands on the outside of each bend and stand with your arms straight down, palms facing your legs. Pull the bar (bending your arms at the elbow) to your chest, and the push the bar above your head (arms as straight as possible). Return the bar to your chest by dropping your arms at the elbows. Return the bar to it's origional position (stand with your arms straight down, palms facing your legs.)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-raises-standing",
    "name": "Leg Raises, Standing",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "Put your forearms on the pads on the leg raise machine, the body is hanging freely. Lift now your legs with a fast movement as high as you can, make a short pause of 1sec at the top, and bring them down again. Make sure that during the exercise your body does not swing, only the legs should move.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leverage-machine-chest-press",
    "name": "Leverage Machine Chest Press",
    "equipment": "Bodyweight",
    "primary": "Chest",
    "secondary": [],
    "highlight": [
      "chest"
    ],
    "view": "front",
    "description": "Be sure to adjust seat height so that the handles are towards the bottom of your pectorals.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-raises-lying",
    "name": "Leg Raises, Lying",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs",
      "chest"
    ],
    "view": "front",
    "description": "Lay down on a bench and hold onto the recliner with your hands to keep you stable. Hold your legs straight and lift them till they make an angle of about 45°. Make a short pause of 1 sec. and go slowly down to the initial position. To increase the intensity you can make a longer pause of 7 sec. every 5th time.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-raise",
    "name": "Leg Raise",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "The leg raise is a strength training exercise which targets the iliopsoas (the anterior hip flexors). Because the abdominal muscles are used isometrically to stabilize the body during the motion, leg raises are also often used to strengthen the rectus abdominis muscle and the internal and external oblique muscles.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "low-box-squat-wide-stance",
    "name": "Low Box Squat - Wide Stance",
    "equipment": "Barbell",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Unrack the bar and set your stance wide, beyond your hips. Push your hips back and sit down to a box that takes you below parallel. Sit completely down, do not touch and go. Then explosively stand up. Stay tight in your upper back and torso throughout the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-curls-standing",
    "name": "Leg Curls (standing)",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-press-on-hackenschmidt-machine",
    "name": "Leg Press on Hackenschmidt Machine",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-presses-narrow",
    "name": "Leg Presses (narrow)",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "The exercise is very similar to the wide leg press: Sit on the machine and put your feet on the platform so far apart that you could just put another foot in between them. The feet are parallel and point up. Lower the weight so much, that the knees form a right angle. Push immediately the platform up again, without any pause. When in the lower position, the knees point a bit outwards and the movement should be always fluid.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-presses-wide",
    "name": "Leg Presses (wide)",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "Sit on the machine and put your feet on the platform, a bit more than shoulder wide. The feet are turned outwards by a few degrees. Lower the weight so much, that the knees form a right angle. Push immediately the platform up again, without any pause. When in the lower position, the knees point a bit outwards and the movement should be always fluid.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "leg-press",
    "name": "Leg Press",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Calves",
      "Glutes"
    ],
    "highlight": [
      "hamstrings",
      "calves",
      "glutes"
    ],
    "view": "back",
    "description": "The leg press is a weight training exercise in which the individual pushes a weight or resistance away from them using their legs.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pendelay-rows",
    "name": "Pendelay Rows",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Biceps",
      "Triceps"
    ],
    "highlight": [
      "lats",
      "biceps",
      "triceps"
    ],
    "view": "back",
    "description": "Back excercise with a barbell with a starting position which is in a bent over position with the back paralell to the ground. The barbell is on the ground at chest level.For the movement grab the barbell at shoulder width grip and pull towards your chest without losing the bent over position and without moving anything but your arms",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rack-deadlift",
    "name": "Rack Deadlift",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "glutes",
      "biceps"
    ],
    "view": "back",
    "description": "Deadlift to be done using a Smith machine or a free rack. Bar or barbell hould be just right under the knee cap level. Lift using the glutes and through the heels, then come back to starting postion with a control movement of 2 seconds. This exercise targets mainly the lower back and glutes.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "push-press",
    "name": "Push Press",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "upperBack",
      "glutes"
    ],
    "view": "back",
    "description": "Clean your dumbbells onto your shoulders, palms facing in. Take a breath and brace your core. (picture 1)Dip at the knees and use your legs to help (picture 2) press your dumbbells overhead. Lower under control with a slow tempo to your shoulders and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pause-bench",
    "name": "Pause Bench",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "chest",
      "triceps"
    ],
    "view": "front",
    "description": "Lower the bar to your chest and pause (but do not rest) there for 2 seconds. Press back up. use the same weight you would on bench press, but perform only single reps. Total the number of reps you did in one set of bench press (if you did 3 sets of 8 do 8 sinlge pause bench reps.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "preacher-curls",
    "name": "Preacher Curls",
    "equipment": "Barbell",
    "primary": "",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Place the EZ curl bar on the rest handles in front of the preacher bench. Lean over the bench and grab the EZ curl bar with palms up. Sit down on the preacher bench seat so your upper arms rest on top of the pad and your chest is pressed against the pad. Lower the weight until your elbows are extended and arms are straight. Bring the weights back up to the starting point by contracting biceps. Repeat",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rear-delt-raises",
    "name": "Rear Delt Raises",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Seated on a bench with the dumbbells on the floor bend over at 45 Degrees and then slowly raise each dumbbell to shoulder height and hold for a couple seconds before lowering to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pistol-squat",
    "name": "Pistol Squat",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "hamstrings",
      "shoulders",
      "biceps"
    ],
    "view": "back",
    "description": "Stand with feet hip-width apart, toes pointed forward, and chest tall. Extend your leg straight out; extend both arms in front of you, at shoulder level. Brace your core and look straight ahead. Slowly squat down. (optional) pause at the bottom. Keep your (free) leg and arms extended for the whole duration.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pull-ups-on-machine",
    "name": "Pull Ups on Machine",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps",
      "upperBack"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "pull-ups",
    "name": "Pull-ups",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps",
      "upperBack"
    ],
    "view": "back",
    "description": "Grab the pull up bar with a wide grip, the body is hanging freely. Keep your chest out and pull yourself up till your chin reaches the bar or it touches your neck, if you want to pull behind you. Go with a slow and controlled movement down, always keeping the chest out.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "scissors",
    "name": "Scissors",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Scissors is an abdominal exercise that strengthens the transverse abdominals, helping flatten your belly and strengthen your entire core. Scissors is not only a core strength move, but it is also a great stretch for your hamstrings and your lower back. Everyone is looking for new ways to work the core, to flatten the belly and to improve flexibility. If you learn how to do Scissors you will get everything rolled together in one move.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rowing-seated-narrow-grip",
    "name": "Rowing seated, narrow grip",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Tighten muscles Controlled movement Slow movement Keep upper body upright Do not lean back Pull toward chest",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-bar-curl",
    "name": "Reverse Bar Curl",
    "equipment": "Barbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Hold bar with reverse (or \"overhand\") grip, palms facing the floor.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "renegade-row",
    "name": "Renegade Row",
    "equipment": "Dumbbell",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Get into pushup position gripping some dumbbells. Perform one pushup, then drive your left elbo up, bringing the dumbell up to your body. Return the dumbell to starting position. Perform another pushup and then row with the other arm to complete one rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rowing-t-bar",
    "name": "Rowing, T-bar",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Shoulders",
      "Biceps"
    ],
    "highlight": [
      "lats",
      "shoulders",
      "biceps"
    ],
    "view": "back",
    "description": "The execution of this exercise is very similar to the regular bent over rowing, only that the bar is fixed here. Grab the barbell with a wide grip (slightly more than shoulder wide) and lean forward. Your upper body is not quite parallel to the floor, but forms a slight angle. The chest's out during the whole exercise. Pull now the barbell with a fast movement towards your belly button, not further up. Go slowly down to the initial position. Don't swing with your body and keep your arms next to your body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "row",
    "name": "Row",
    "equipment": "Barbell",
    "primary": "Lats",
    "secondary": [
      "Quads"
    ],
    "highlight": [
      "lats",
      "quads"
    ],
    "view": "back",
    "description": "In strength training, rowing (or a row, usually preceded by a qualifying adjective — for instance a seated row) is an exercise where the purpose is to strengthen the muscles that draw the rower's arms toward the body (latissimus dorsi) as well as those that retract the scapulae (trapezius and rhomboids) and those that support the spine (erector spinae). When done on a rowing machine, rowing also exercises muscles that extend and support the legs (quadriceps and thigh muscles). In all cases, the abdominal and lower back muscles must be used in order to support the body and prevent back injury.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rowing-lying-on-bench",
    "name": "Rowing, Lying on Bench",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "ring-dips",
    "name": "Ring Dips",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Dips peformed on gymnastic rings.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-press-on-machine",
    "name": "Shoulder Press, on Machine",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "reverse-grip-bench-press",
    "name": "Reverse Grip Bench Press",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders"
    ],
    "highlight": [
      "chest",
      "shoulders"
    ],
    "view": "front",
    "description": "Upper chest focuses exercise that also works triceps",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "run-interval-training",
    "name": "Run - Interval Training",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Run and do some interval trainings such as hill repat, fartlek,..",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-bench-press-barbell",
    "name": "Incline Bench Press - Barbell",
    "equipment": "Barbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "To do slowly, tempo is 4010",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shotgun-row",
    "name": "Shotgun Row",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [],
    "highlight": [
      "lats"
    ],
    "view": "back",
    "description": "Attach a single handle to a low cable. After selecting the correct weight, stand a couple feet back with a wide-split stance. Your arm should be extended and your shoulder forward. This will be your starting position. Perform the movement by retracting the shoulder and flexing the elbow. As you pull, supinate the wrist, turning the palm upward as you go. After a brief pause, return to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "splinter-sit-ups",
    "name": "Splinter Sit-ups",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Lie on your back with your legs straight and arms at your sides, keeping your elbows bent at 90 degrees. As you sit up, twist your upper body to the left and bring your left knee toward your right elbow while you swing your left arm back. Lower your body to the starting position, and repeat to your right. That's 1 rep.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "speed-deadlift",
    "name": "Speed Deadlift",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Deadlift with short (less than one 1min) rest between sets.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-press-on-multi-press",
    "name": "Shoulder Press, on Multi Press",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "The exercise is basically the same as with a free barbell: Sit on a bench, the back rest should be almost vertical. Take a bar with a shoulder wide grip and bring it down to chest height. Press the weight up, but don't stretch the arms completely. Go slowly down and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sit-ups",
    "name": "Sit-ups",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Sit on a mat, your calves are resting on a bench, the knees make a right angle. Hold your hands behind your neck. Go now up with a rolling movement of your back, you should feel how the individual vertebrae lose contact with the mat. At the highest point, contract your abs as much as you can and hold there for 2 sec. Go now down, unrolling your back.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-press-dumbbells",
    "name": "Shoulder Press, Dumbbells",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Sit on a bench, the back rest should be almost vertical. Take two dumbbells and bring them up to shoulder height, the palms and the elbows point during the whole exercise to the front. Press the weights up, at the highest point they come very near but don't touch. Go slowly down and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-press-barbell",
    "name": "Shoulder Press, Barbell",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Sit on a bench, the back rest should be almost vertical. Take a barbell with a shoulder wide grip and bring it up to chest height. Press the weight up, but don't stretch the arms completely. Go slowly down and repeat.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "single-arm-preacher-curl",
    "name": "Single-arm Preacher Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Sit on the preacher curl bench and perform a bicep curl with a dumbbell in one hand. Your other hand can be at rest, or beneath your curling arm's elbow.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-to-side-push-ups",
    "name": "Side to Side Push Ups",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "-start in push up position -lean the body weight to the right side, and complete a push up with the chest over the right hand -come back to the centered position -on rep 2, lean to the left side",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "smith-machine-close-grip-bench-press",
    "name": "Smith Machine Close-grip Bench Press",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [
      "Chest"
    ],
    "highlight": [
      "triceps",
      "chest"
    ],
    "view": "back",
    "description": "Perform a standard bench press on the smith machine, but have your hands on the bar about shoulder width apart, and keep your elbows close to your body.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-crunch",
    "name": "Side Crunch",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [
      "Abs"
    ],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Hold weight in one hand. Bend side ways to the knee. Pull upo to upright position using your obliquus.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shrugs-barbells",
    "name": "Shrugs, Barbells",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Take a barbell and stand with a straight body, the arms are hanging freely in front of you. Lift from this position the shoulders as high as you can, but don't bend the arms during the movement. On the highest point, make a short pause of 1 or 2 seconds before returning slowly to the initial position. When training with a higher weight, make sure that you still do the whole movement!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shrugs-on-multipress",
    "name": "Shrugs on Multipress",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shrugs-dumbbells",
    "name": "Shrugs, Dumbbells",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [
      "shoulders"
    ],
    "view": "front",
    "description": "Stand with straight body, the hands are hanging freely on the side and hold each a dumbbell. Lift from this position the shoulders as high as you can, but don't bend the arms during the movement. On the highest point, make a short pause of 1 or 2 seconds before returning slowly to the initial position. When training with a higher weight, make sure that you still do the whole movement!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "shoulder-shrug",
    "name": "Shoulder Shrug",
    "equipment": "Bodyweight",
    "primary": "",
    "secondary": [],
    "highlight": [
      "upperBack"
    ],
    "view": "back",
    "description": "The shoulder shrug (usually called simply the shrug) is an exercise in weight training used to develop the upper trapezius muscle. The lifter stands erect, hands about shoulder width apart, and raises the shoulders as high as possible, and then lowers them, while not bending the elbows, or moving the body at all. The lifter may not have as large a range of motion as in a normal shrug done for active flexibility. It is usually considered good form if the slope of the shoulders is horizontal in the elevated position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "side-plank",
    "name": "Side Plank",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Works your obliques and helps stabilize your spine. Lie on your side and support your body between your forearm and knee to your feet.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "straight-arm-pull-down-bar-attachment",
    "name": "Straight-arm Pull Down (bar Attachment)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "lats",
      "triceps"
    ],
    "view": "back",
    "description": "Use the straight bar attachment on a high pulley. Grasp the two ends of the bar with your palms facing downward and your arms straight out in front of you. Pull your hands down towards your hips, while keeping your arms straight, then raise them back up to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sumo-squats",
    "name": "Sumo Squats",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "Stand with your feet wider than your shoulders, with your toes pointed out at a 45 degree angle and barbell on your shoulder. While keeping your back straight, descend slowly by bending at the knees and hips as if you are sitting down (squatting). Lower yourself until your quadriceps and hamstrings are parallel to the floor. Return to the starting position by pressing upwards and extending your legs while maintaining an equal distribution of weight on your forefoot and heel.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "straight-arm-pull-down-rope-attachment",
    "name": "Straight-arm Pull Down (rope Attachment)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Triceps"
    ],
    "highlight": [
      "lats",
      "triceps"
    ],
    "view": "back",
    "description": "Use the rope attachment on a high pulley. Grasp the two ends of the rope with your arms straight out in front of you. Pull your hands down towards your hips, while keeping your arms straight, then raise them back up to the starting position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "sumo-deadlift",
    "name": "Sumo Deadlift",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "Begin with a bar loaded on the ground. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Relax the shoulders, which in effect lengthens your arms. Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees. As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together. Return the weight to the ground by bending at the hips and controlling the weight on the way down.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "squat-thrust",
    "name": "Squat Thrust",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [
      "glutes"
    ],
    "view": "back",
    "description": "The burpee, or squat thrust, is a full body exercise used in strength training and as an aerobic exercise. The basic movement is performed in four steps and known as a four-count burpee: Begin in a standing position. Move into a squat position with your hands on the ground. (count 1) Kick your feet back into a plank position, while keeping your arms extended. (count 2) Immediately return your feet into squat position. (count 3) Stand up from the squat position (count 4)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "stiff-legged-deadlifts",
    "name": "Stiff-legged Deadlifts",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "hamstrings",
      "glutes"
    ],
    "view": "back",
    "description": "Keep legs straight Keep back straight",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-calf-raises",
    "name": "Standing Calf Raises",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "Get onto the calf raises machine, you should able to completely push your calves down. Stand straight, don't make a hollow back and don't bend your legs. Pull yourself up as high as you can. Make a small pause of 1 - 2 seconds and go slowly down.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "squat-jumps",
    "name": "Squat Jumps",
    "equipment": "Bodyweight",
    "primary": "Quads",
    "secondary": [],
    "highlight": [
      "quads"
    ],
    "view": "front",
    "description": "Jump wide, then close",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "squats",
    "name": "Squats",
    "equipment": "Barbell",
    "primary": "Quads",
    "secondary": [
      "Glutes"
    ],
    "highlight": [
      "quads",
      "glutes"
    ],
    "view": "front",
    "description": "Place a barbell in a rack just below shoulder-height. Dip under the bar to put it behind the neck across the top of the back, and grip the bar with the hands wider than shoulder-width apart. Lift the chest up and squeeze the shoulder blades together to keep the straight back throughout the entire movement. Stand up to bring the bar off the rack and step backwards, then place the feet so that they are a little wider than shoulder-width apart. Sit back into hips and keep the back straight and the chest up, squatting down so the hips are below the knees. From the bottom of the squat, press feet into the ground and push hips forward to return to the top of the standing position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "standing-bicep-curl",
    "name": "Standing Bicep Curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Stand holding dumbbells at shoulder width apart. Face forearm upward and keep upper arm still while raising each dumbbell up to your shoulder.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-extensions-on-cable-with-bar",
    "name": "Triceps Extensions on Cable With Bar",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Grab the bar, stand with your feet shoulder wide, keep your back straight and lean forward a little. Push the bar down, making sure the elbows don't move during the exercise. Without pause go back to the initial position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-handstand",
    "name": "Wall Handstand",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Handstand against a wall for support (chest facing wall).",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "underhand-lat-pull-down",
    "name": "Underhand Lat Pull Down",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "lats",
      "biceps"
    ],
    "view": "back",
    "description": "Grip the pull-down bar with your palms facing you and your hands closer than shoulder-width apart. Lean back slightly and keep your back straight. Pull the bar down towards your chest, pulling your shoulders back slightly at the end of the motion.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "upright-row-w-dumbbells",
    "name": "Upright Row w/ Dumbbells",
    "equipment": "Dumbbell",
    "primary": "Shoulders",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "shoulders",
      "biceps"
    ],
    "view": "front",
    "description": "Feet apart at shoulder width. Nice and Slow!",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "v-bar-pulldown",
    "name": "V-Bar Pulldown",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Pulldowns using close grip v-bar.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "calf-raises-one-legged",
    "name": "Calf raises, one legged",
    "equipment": "Bodyweight",
    "primary": "Calves",
    "secondary": [],
    "highlight": [
      "calves"
    ],
    "view": "back",
    "description": "",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "upright-row-sz-bar",
    "name": "Upright Row, SZ-bar",
    "equipment": "Barbell",
    "primary": "Shoulders",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "shoulders",
      "biceps"
    ],
    "view": "front",
    "description": "Stand straight, your feet are shoulder-width apart. Hold the SZ-bar with an overhand grip on your thighs, the arms are stretched. Lift the bar close to the body till your chin. The elbows point out so that at the highest point they form a V. Make here a short pause before going slowly down and repeating the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-pushup",
    "name": "Wall Pushup",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Glutes",
      "Abs"
    ],
    "highlight": [
      "shoulders",
      "glutes",
      "abs",
      "chest",
      "upperBack"
    ],
    "view": "front",
    "description": "Pushup against a wall",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "upright-row-on-multi-press",
    "name": "Upright Row, on Multi Press",
    "equipment": "Bodyweight",
    "primary": "Shoulders",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "shoulders",
      "biceps"
    ],
    "view": "front",
    "description": "The movements are basically the same as with an SZ-bar, but you use the bar on the multi press: Stand straight, your feet are shoulder-width apart. Hold the bar with an overhand grip on your thighs, the arms are stretched. Lift the bar close to the body till your chin. The elbows point out so that at the highest point they form a V. Make here a short pause before going slowly down and repeating the movement.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "dumbbell-concentration-curl",
    "name": "Dumbbell Concentration Curl",
    "equipment": "Dumbbell",
    "primary": "",
    "secondary": [
      "Biceps"
    ],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Sit on bench. Grasp dumbbell between feet. Place back of upper arm to inner thigh. Lean into leg to raise elbow slightly.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "overhead-squat",
    "name": "Overhead Squat",
    "equipment": "Bodyweight",
    "primary": "Legs",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "The barbell is held overhead in a wide-arm snatch grip; however, it is also possible to use a closer grip if balance allows.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "run-treadmill",
    "name": "Run - Treadmill",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Run on a treadmill",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "incline-bench-press-dumbbell",
    "name": "Incline Bench Press - Dumbbell",
    "equipment": "Dumbbell",
    "primary": "Chest",
    "secondary": [
      "Shoulders",
      "Triceps"
    ],
    "highlight": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "view": "front",
    "description": "Bench should be angled anywhere from 30 to 45 degrees Be sure to press dumbbells straight upward (perpendicular to the floor)",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "triceps-extensions-on-cable",
    "name": "Triceps Extensions on Cable",
    "equipment": "Bodyweight",
    "primary": "Triceps",
    "secondary": [],
    "highlight": [
      "triceps"
    ],
    "view": "back",
    "description": "Grab the cable, stand with your feet shoulder wide, keep your back straight and lean forward a little. Push the bar down, making sure the elbows don't move during the exercise. Rotate your hands outwards at the very end and go back to the initial position without pause.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "rowing-with-trx-band",
    "name": "Rowing with TRX band",
    "equipment": "Bodyweight",
    "primary": "Back",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Rowing with resistance bands - Bodyweight Exercise",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "wall-squat",
    "name": "Wall Squat",
    "equipment": "Bodyweight",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "Find a nice flat piece of wall and stand with your back leaning against the wall. Slowly slide down the wall while moving your feet away from it, until your thighs are parallel to the ground and both your knees and your hips are bent at a 90° angle. Cross your arms in front of your chest and hold this position for 30 seconds. Variant: put a big inflated rubber ball (like a small basketball) between your knees and squeeze the ball while holding the squat position",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "crunches-with-cable",
    "name": "Crunches With Cable",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [],
    "highlight": [
      "abs"
    ],
    "view": "front",
    "description": "Take the cable on your hands and hold it next to your temples. Knee down and hold your upper body straight and bend forward. Go down with a fast movement, rolling your back in (your ellbows point to your knees). Once down, go slowly back to the initial position.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "kickstand-rdl",
    "name": "Kickstand RDL",
    "equipment": "Barbell",
    "primary": "Hamstrings",
    "secondary": [],
    "highlight": [
      "hamstrings"
    ],
    "view": "back",
    "description": "use non-working leg's toes to help with balance and perform an RDL.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "alternating-dumbbell-hammer-curl",
    "name": "Alternating dumbbell hammer curl",
    "equipment": "Dumbbell",
    "primary": "Biceps",
    "secondary": [],
    "highlight": [
      "biceps"
    ],
    "view": "front",
    "description": "Stand with your knees slightly bent and your back straight. Hold a dumbbell in each hand, using a neutral grip at your sides.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "straddle-l-sit",
    "name": "Straddle L-Sit",
    "equipment": "Bodyweight",
    "primary": "Abs",
    "secondary": [
      "Lats",
      "Chest",
      "Quads"
    ],
    "highlight": [
      "abs",
      "lats",
      "chest",
      "quads"
    ],
    "view": "front",
    "description": "With your legs in a sitting saddle position, push your body upwards off the ground. Your legs should be horizontal and point straight outwards. Your arms should be between your legs. Hold isometrically as long as required.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "l-sit",
    "name": "L-sit",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Quads",
      "Triceps"
    ],
    "highlight": [
      "lats",
      "quads",
      "triceps"
    ],
    "view": "back",
    "description": "Sit on the ground with your legs together and your arms by your sides. Push your body off the ground using your hands, maintaining the same sitting position so that your legs are straight and your feet do not touch the floor. Hold for as long as required.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "l-sit-foot-supported",
    "name": "L-Sit (Foot Supported)",
    "equipment": "Bodyweight",
    "primary": "Lats",
    "secondary": [
      "Quads",
      "Triceps"
    ],
    "highlight": [
      "lats",
      "quads",
      "triceps"
    ],
    "view": "back",
    "description": "As with an L-sit, but allow your feet to touch the floor to support the some of the weight of your legs.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  },
  {
    "id": "diaphragmatic-breathing",
    "name": "Diaphragmatic Breathing",
    "equipment": "Bodyweight",
    "primary": "Glutes",
    "secondary": [],
    "highlight": [],
    "view": "back",
    "description": "Belly breathing. Hand on chest stays still, hand on belly rises. 8-10 slow breaths.",
    "tips": [],
    "pr": "",
    "lastUsed": "",
    "lastWeight": ""
  }
] as Exercise[]

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id)
}

export const MUSCLE_GROUPS = [
  "Alle",
  "Bryst",
  "Rygg",
  "Skuldre",
  "Biceps",
  "Triceps",
  "Bein",
  "Glutes",
  "Mage",
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]

const MUSCLE_GROUP_MAP: Record<MuscleGroup, string[]> = {
  "Alle": [],
  "Bryst": ["Chest", "Pectoralis major", "Serratus anterior"],
  "Rygg": ["Upper Back", "Lats", "Lower Back", "Trapezius", "Latissimus dorsi", "Erector spinae"],
  "Skuldre": ["Shoulders", "Anterior deltoid", "Posterior deltoid"],
  "Biceps": ["Biceps", "Biceps brachii", "Brachialis"],
  "Triceps": ["Triceps", "Triceps brachii"],
  "Bein": ["Quads", "Hamstrings", "Calves", "Quadriceps femoris", "Biceps femoris", "Gastrocnemius", "Soleus"],
  "Glutes": ["Glutes", "Gluteus maximus"],
  "Mage": ["Abs", "Rectus abdominis"],
}

export function filterExercises(group: MuscleGroup, query: string): Exercise[] {
  const q = query.toLowerCase().trim()
  return EXERCISES.filter(e => {
    const matchesGroup = group === "Alle" || MUSCLE_GROUP_MAP[group].some(m =>
      e.primary.toLowerCase().includes(m.toLowerCase())
    )
    const matchesQuery =
      q === "" ||
      e.name.toLowerCase().includes(q) ||
      e.primary.toLowerCase().includes(q)
    return matchesGroup && matchesQuery
  })
}
