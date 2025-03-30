INSERT INTO organizations (organization_uuid, organization_id) 
VALUES 
('4bb3cc3d-7236-0952-2db5-295a61b0bf6b', 'TRANs');

INSERT INTO users (user_uuid, user_id, hashed_password) 
VALUES 
('792ff4c0-92c4-921a-c096-84c24e1c8168', 'kombumori', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');

INSERT INTO memberships (membership_uuid, organization_uuid, user_uuid, role) 
VALUES 
('63fb838c-ae2d-b785-a8e9-fc528b8478b4', '4bb3cc3d-7236-0952-2db5-295a61b0bf6b', '792ff4c0-92c4-921a-c096-84c24e1c8168', 'admin');

INSERT INTO profiles (profile_uuid, profile_type, organization_uuid, user_uuid, display_name, bio, avatar, instagram_id, threads_id, twitter_id) 
VALUES 
('38f540f2-3ea9-dc96-293d-3b00d680cc10', 'organization', '4bb3cc3d-7236-0952-2db5-295a61b0bf6b', NULL, 'TRANs', NULL, 'https://avatars.githubusercontent.com/u/96778966', 'trans.stki', NULL, NULL),
('8567bbb1-75be-27cd-b588-f1c13383b7ff', 'user', NULL, '792ff4c0-92c4-921a-c096-84c24e1c8168', 'Kombumori', NULL, 'https://avatars.githubusercontent.com/u/96778966', NULL, NULL, NULL);


