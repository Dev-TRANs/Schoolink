-- 1. 新規組織の作成
INSERT INTO organizations (
    organization_uuid,
    organization_id,
    created_at
) VALUES (
    'ece98901-274c-ec55-fba9-2900a844c4b5',
    'trans',
    unixepoch()
);

-- 2. 管理者ユーザーの作成
INSERT INTO users (
    user_uuid,
    user_id,
    hashed_password,
    is_valid,
    is_frozen,
    created_at
) VALUES (
    '64a6cd46-1753-7f4e-5ade-d4bd1f2150fc',
    'kombumori',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',  -- "password" / SHA-256
    1,
    0,
    unixepoch()
);

-- 3. メンバーシップ（adminとして登録）
INSERT INTO memberships (
    membership_uuid,
    organization_uuid,
    user_uuid,
    role,
    joined_at
) VALUES (
    'dc9c737b-2365-432b-31be-91e751e9ddcb',
    'ece98901-274c-ec55-fba9-2900a844c4b5',
    '64a6cd46-1753-7f4e-5ade-d4bd1f2150fc',
    'admin',
    unixepoch()
);

-- 4. 組織のプロフィール作成
INSERT INTO profiles (
    profile_uuid,
    profile_type,
    organization_uuid,
    display_name,
    updated_at
) VALUES (
    'cea10fb8-a7e0-297a-ccc4-3a2a942047b2',
    'organization',
    'ece98901-274c-ec55-fba9-2900a844c4b5',
    'TRANs',
    unixepoch()
);

-- 5. 管理者ユーザーのプロフィール作成
INSERT INTO profiles (
    profile_uuid,
    profile_type,
    user_uuid,
    display_name,
    updated_at
) VALUES (
    'f1758c7a-48f8-d4ec-ec91-3f13f2f15609',
    'user',
    '64a6cd46-1753-7f4e-5ade-d4bd1f2150fc',
    'kombumori',
    unixepoch()
);