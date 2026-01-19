export const SYMPTOM_TAGS = {
    physical: [
        "cramps",
        "bloating",
        "fatigue",
        "headache",
        "back_pain",
        "joint_pain",
        "breast_tenderness",
        "nausea",
        "dizziness",
    ],
    skin_hair: [
        "acne",
        "oily_skin",
        "dry_skin",
        "hair_loss",
        "excess_hair_growth",
    ],
    digestive: ["constipation", "diarrhea", "gas", "stomach_pain"],
    emotional: ["anxious", "irritable", "low_mood", "brain_fog", "mood_swings"],
    sleep_rest: ["insomnia", "restless_sleep", "night_sweats"],
    cycle_irregularities: [
        "heavy_flow",
        "light_flow",
        "spotting",
        "missed_period",
        "irregular_cycle",
        "clotting",
    ],
} as const;

export const ALL_SYMPTOM_TAGS = [
    ...SYMPTOM_TAGS.physical,
    ...SYMPTOM_TAGS.skin_hair,
    ...SYMPTOM_TAGS.digestive,
    ...SYMPTOM_TAGS.emotional,
    ...SYMPTOM_TAGS.sleep_rest,
    ...SYMPTOM_TAGS.cycle_irregularities,
] as const;

export type CanonicalSymptomTag = (typeof ALL_SYMPTOM_TAGS)[number];

export const SYMPTOM_TAG_LABELS: Record<CanonicalSymptomTag, string> = {
    cramps: "Cramps",
    bloating: "Bloating",
    fatigue: "Fatigue",
    headache: "Headache",
    back_pain: "Back pain",
    joint_pain: "Joint pain",
    breast_tenderness: "Breast tenderness",
    nausea: "Nausea",
    dizziness: "Dizziness",

    acne: "Acne",
    oily_skin: "Oily skin",
    dry_skin: "Dry skin",
    hair_loss: "Hair loss",
    excess_hair_growth: "Excess hair growth",

    constipation: "Constipation",
    diarrhea: "Diarrhea",
    gas: "Gas",
    stomach_pain: "Stomach pain",

    anxious: "Anxious",
    irritable: "Irritable",
    low_mood: "Low mood",
    brain_fog: "Brain fog",
    mood_swings: "Mood swings",

    insomnia: "Insomnia",
    restless_sleep: "Restless sleep",
    night_sweats: "Night sweats",

    heavy_flow: "Heavy flow",
    light_flow: "Light flow",
    spotting: "Spotting",
    missed_period: "Missed period",
    irregular_cycle: "Irregular cycle",
    clotting: "Clotting",
};
