# Corley's Island: the townsfolk cast, one MakeHuman person for each character of models/peds/peds.json (same ids, same
# order: the game's tfOut bits and the Townsfolk page follow it). Read by tools/peds/build_folk.py (in Blender) and
# tools/peds/pack_folk.py. Every asset is from MakeHuman's CC0 asset packs (CREDITS.md).
#   g: 1 man, 0 woman; age in years; w weight, m muscle (0..1, 0.5 average); race: caucasian / african / asian mix
#   skin: an MPFB skin (skins/<name>); hair: hair/<name> with its tint (None keeps the texture's own colour)
#   wear: [clothes/<name>, tint] in the order they go on; glasses: clothes/<name>
# Tints recolour a garment's texture keeping its shading and weave (pack_folk.py `tint`); a whole suit tints as one.
C = 'caucasian'
A = 'african'
S = 'asian'

CAST = [
    dict(id='cal_m', g=1, age=42, w=.55, m=.55, race=C, skin='middleage_caucasian_male', hair=('short02', '#5a4030'), brows='eyebrow001',
         wear=[('namuhekam_male_polo_shirt', '#2a3550'), ('toigo_wool_pants', '#b59f78'), ('shoes01', None)]),
    dict(id='cal_f', g=0, age=38, w=.5, m=.45, race=C, skin='middleage_caucasian_female', hair=('toigo_curled_under_bob', '#8a6a4a'), brows='eyebrow010',
         wear=[('joepal_crude_t-shirt_female', '#9c9c9a'), ('toigo_wool_pants', '#4d6a90'), ('shoes05', None)]),
    dict(id='cal_k', g=1, age=10, w=.5, m=.5, race=A, skin='young_african_male', hair=('short04', '#1a1410'), brows='eyebrow002',
         wear=[('elvs_crude_t-shirt_male', '#b3262a'), ('cortu_cargo_pants', '#253350'), ('shoes05', None)]),
    dict(id='m60_cap', g=1, age=62, w=.6, m=.45, race=C, skin='old_caucasian_male', hair=('short01', '#8f8c86'), brows='eyebrow003',
         wear=[('male_casualsuit03', None), ('shoes03', '#5a3d24'), ('jujube_newsboy_cap', '#4f6b8c')]),
    dict(id='f50_scrubs', g=0, age=52, w=.6, m=.45, race=A, skin='middleage_african_female', hair=('rehmanpolanski_hair_bun_brown', '#2a1d16'), brows='eyebrow011',
         wear=[('joepal_crude_t-shirt_female', '#e0806f'), ('toigo_wool_pants', '#e0806f'), ('toigo_flats', '#efefea')]),
    dict(id='m25_hoodie', g=1, age=25, w=.5, m=.55, race=C, skin='young_caucasian_male', hair=('short03', '#3b2a1e'), brows='eyebrow001',
         wear=[('toigo_fisherman_sweater', '#3a3d42'), ('cortu_cargo_pants', '#1f2023'), ('shoes06', '#8d9096')]),
    dict(id='f30_jog', g=0, age=30, w=.4, m=.6, race=C, skin='young_caucasian_female', hair=('ponytail01', '#6a4a2c'), brows='eyebrow010',
         wear=[('female_sportsuit01', None), ('shoes05', None)]),
    dict(id='m30_tee', g=1, age=30, w=.5, m=.6, race=A, skin='young_african_male', hair=('short04', '#141010'), brows='eyebrow002',
         wear=[('male_casualsuit06', None), ('shoes05', None)]),
    dict(id='f70_cardigan', g=0, age=72, w=.6, m=.35, race=C, skin='old_caucasian_female', hair=('toigo_curled_under_bob', '#e6e2da'), brows='eyebrow012',
         wear=[('toigo_fisherman_sweater', '#a08cc0'), ('toigo_wool_pants', '#c8b89a'), ('toigo_flats', '#a8845c')], glasses='kwnet_at_optical_glasses'),
    dict(id='m40_cargo', g=1, age=44, w=.55, m=.6, race=C, skin='middleage_caucasian_male', hair=('short02', '#4a3626'), brows='eyebrow003',
         wear=[('elvs_crude_t-shirt_male', '#5d6b3a'), ('cortu_cargo_pants', '#a89a74'), ('culturalibre_male_boots', '#5a3d24')]),
    dict(id='f16_teen', g=0, age=16, w=.45, m=.5, race=A, skin='young_african_female', hair=('elvs_double_mh_braid', '#16110e'), brows='eyebrow011',
         wear=[('joepal_crude_t-shirt_female', '#d4a52a'), ('toigo_wool_pants', '#7c95b5'), ('shoes05', None)]),
    dict(id='m35_office', g=1, age=35, w=.5, m=.5, race=S, skin='middleage_asian_male', hair=('short02', '#141414'), brows='eyebrow001',
         wear=[('namuhekam_male_polo_shirt', '#a9c4e0'), ('toigo_wool_pants', '#3b3b40'), ('shoes04', None)]),
    dict(id='k8_girl', g=0, age=8, w=.5, m=.5, race=C, skin='young_caucasian_female', hair=('toigo_blunt_bob_with_bangs', '#d9b56a'), brows='eyebrow012',
         wear=[('joepal_crude_t-shirt_female', '#7d4fb0'), ('toigo_wool_pants', '#8ea6c4'), ('shoes06', '#d77fa1')]),
    dict(id='m65_church', g=1, age=66, w=.55, m=.45, race=A, skin='old_african_male', hair=('short01', '#8a8884'), brows='eyebrow003',
         wear=[('male_elegantsuit01', None), ('shoes04', None)]),
    dict(id='f25_capri', g=0, age=25, w=.45, m=.45, race=C, skin='young_caucasian_female2', hair=('toigo_curled_under_bob', '#d8bb7a'), brows='eyebrow010',
         wear=[('joepal_crude_t-shirt_female', '#f0efe9'), ('toigo_wool_pants', '#9fae8a'), ('toigo_flats', '#b08a5e')]),
    dict(id='m35_vest', g=1, age=35, w=.55, m=.65, race=C, skin='middleage_caucasian_male', hair=('short03', '#5a4030'), brows='eyebrow001',
         wear=[('elvs_crude_t-shirt_male', '#c6ec1c'), ('cortu_cargo_pants', '#465c80'), ('shoes03', '#a07a4e')]),
    dict(id='m15_skate', g=1, age=15, w=.45, m=.45, race=C, skin='young_caucasian_male2', hair=('cortu_short_messy_hair', '#6a4a30'), brows='eyebrow002',
         wear=[('elvs_crude_t-shirt_male', '#1d1d1f'), ('cortu_cargo_pants', '#6e7074'), ('toigo_mj_cloth_shoes', None)]),
    dict(id='f28_maroon', g=0, age=28, w=.45, m=.45, race=S, skin='young_asian_female', hair=('long01', '#141010'), brows='eyebrow011',
         wear=[('toigo_turtleneck_halter_top', '#6b1f2e'), ('toigo_wool_pants', '#1d1d20'), ('toigo_ankle_boots_female', '#1d1d20')]),
    dict(id='m50_tie', g=1, age=54, w=.6, m=.45, race=C, skin='middleage_caucasian_male', hair=('short03', '#7a746c'), brows='eyebrow003',
         wear=[('toigo_male_suit_tie_and_jacket', None), ('shoes04', None)]),
    dict(id='f45_mom', g=0, age=45, w=.55, m=.4, race=C, skin='middleage_caucasian_female', hair=('bob02', '#6a4a30'), brows='eyebrow010',
         wear=[('female_elegantsuit01', None), ('toigo_flats', '#6a4a30')]),
    dict(id='m17_hoops', g=1, age=17, w=.45, m=.6, race=A, skin='young_african_male', hair=('afro01', '#141010'), brows='eyebrow002',
         wear=[('elvs_crude_t-shirt_male', '#24407a'), ('cortu_cargo_pants', '#1d1d20'), ('shoes05', None)]),
    dict(id='f55_teal', g=0, age=55, w=.55, m=.4, race=S, skin='middleage_asian_female', hair=('toigo_inverted_bob', '#9a968e'), brows='eyebrow012',
         wear=[('joepal_crude_t-shirt_female', '#1f6f73'), ('toigo_wool_pants', '#1d1d20'), ('toigo_flats', '#1d1d20')]),
    dict(id='m30_run', g=1, age=30, w=.4, m=.6, race=C, skin='young_caucasian_male2', hair=('short01', '#3b2a1e'), brows='eyebrow001',
         wear=[('elvs_crude_t-shirt_male', '#f07a1a'), ('toigo_wool_pants', '#1d1d20'), ('shoes06', None)]),
    dict(id='k9_girl', g=0, age=9, w=.5, m=.5, race=A, skin='young_african_female', hair=('ponytail01', '#16110e'), brows='eyebrow011',
         wear=[('joepal_crude_t-shirt_female', '#2ec4c6'), ('toigo_wool_pants', '#d9d6cc'), ('shoes06', '#d77fa1')]),
    dict(id='k7_boy', g=1, age=7, w=.5, m=.5, race=C, skin='young_caucasian_male', hair=('short02', '#c9a35a'), brows='eyebrow002',
         wear=[('elvs_crude_t-shirt_male', '#8fd14f'), ('cortu_cargo_pants', '#253350'), ('shoes06', None)]),
    dict(id='f80_jacket', g=0, age=80, w=.5, m=.3, race=C, skin='old_caucasian_female', hair=('toigo_curled_under_bob', '#ece9e2'), brows='eyebrow012',
         wear=[('toigo_fisherman_sweater', '#9cc0e0'), ('toigo_wool_pants', '#253350'), ('toigo_flats', '#efefea')], glasses='toigo_round_glasses_leopard'),
    dict(id='m40_yard', g=1, age=42, w=.6, m=.65, race=A, skin='middleage_african_male', hair=('short03', '#141010'), brows='eyebrow003',
         wear=[('male_worksuit01', None), ('culturalibre_male_boots', '#5a3d24')]),
    dict(id='f25_pink', g=0, age=25, w=.45, m=.45, race=C, skin='young_caucasian_female', hair=('o4saken_long01', '#2a1d16'), brows='eyebrow010',
         wear=[('toigo_keyhole_tank_top', '#e8a9b8'), ('toigo_wool_pants', '#1d1d20'), ('toigo_flats', '#1d1d20')]),
    dict(id='m70_flannel', g=1, age=72, w=.55, m=.4, race=C, skin='old_caucasian_male', hair=('short01', '#d8d4cc'), brows='eyebrow003',
         wear=[('namuhekam_male_polo_shirt', '#a02828'), ('toigo_wool_pants', '#a89a74'), ('shoes01', None)]),
    dict(id='f35_denim', g=0, age=35, w=.55, m=.45, race=A, skin='middleage_african_female', hair=('afro01', '#1a1410'), brows='eyebrow011',
         wear=[('female_casualsuit01', None), ('shoes06', '#8d9096')]),
    dict(id='m14_pack', g=1, age=14, w=.45, m=.45, race=S, skin='young_asian_male', hair=('short04', '#141414'), brows='eyebrow002',
         wear=[('male_casualsuit02', None), ('shoes06', None)]),
    dict(id='f15_pack', g=0, age=15, w=.45, m=.45, race=C, skin='young_caucasian_female', hair=('ponytail01', '#6a4a30'), brows='eyebrow010',
         wear=[('joepal_crude_t-shirt_female', '#c9c4d6'), ('toigo_wool_pants', '#4d6a90'), ('shoes05', None)]),
]


def macro_age(years):
    """MakeHuman's age slider (0 = 1 year, 0.1875 = 11, 0.5 = 25, 1 = 90) for an age in years"""
    if years <= 11:
        return max(0.0, (years - 1) / 10 * 0.1875)
    if years <= 25:
        return 0.1875 + (years - 11) / 14 * 0.3125
    return min(1.0, 0.5 + (years - 25) / 65 * 0.5)
