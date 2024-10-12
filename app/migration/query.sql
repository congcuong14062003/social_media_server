-- CREATE DATABASE socialmedia;

-- USE socialmedia;

CREATE TABLE
    users (
        user_id VARCHAR(255) PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        user_nickname VARCHAR(255),
        user_email VARCHAR(255) NOT NULL,
        user_password VARCHAR(255) NOT NULL,
        user_status INT DEFAULT 1,
        user_gender VARCHAR(10),
        type_account VARCHAR(25) DEFAULT 'register',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_role INT DEFAULT 0
    );

CREATE TABLE
    UserProfile (
        user_id VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        user_address VARCHAR(255),
        user_school VARCHAR(255),
        user_slogan VARCHAR(1000),
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    UserSetting (
        user_id VARCHAR(255) NOT NULL,
        post_privacy INT DEFAULT 1,
        story_privacy INT DEFAULT 1,
        dark_theme INT DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    UserFaceData (
        user_id VARCHAR(255) NOT NULL,
        media_link VARCHAR(1000) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    ProfileMedia (
        user_id VARCHAR(255) NOT NULL,
        media_type VARCHAR(255),
        media_link VARCHAR(1000),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    ProfileHeart (
        user_id VARCHAR(255) NOT NULL,
        hearted_user_id VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (hearted_user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    Friend (
        requestor_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        relationship_status INT DEFAULT 0,
        FOREIGN KEY (requestor_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    Story (
        story_id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        media_link VARCHAR(1000) NOT NULL,
        story_privacy INT DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        heart_quantity INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    Post (
        post_id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        post_privacy INT DEFAULT 1,
        post_text TEXT DEFAULT NULL,
        react_emoji VARCHAR(255) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    UserPost (
        user_id VARCHAR(255) NOT NULL,
        post_id VARCHAR(255) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (post_id) REFERENCES Post (post_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    PostMedia (
        post_id VARCHAR(255),
        media_link VARCHAR(1000) NOT NULL,
        media_type VARCHAR(255) NOT NULL,
        FOREIGN KEY (post_id) REFERENCES Post (post_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    PostReact (
        post_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        react VARCHAR(255) NOT NULL,
        FOREIGN KEY (post_id) REFERENCES Post (post_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    PostComment (
        comment_id VARCHAR(255) PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        commenting_user_id VARCHAR(255) NOT NULL,
        comment_text TEXT NOT NULL,
        media_link VARCHAR(1000),
        FOREIGN KEY (post_id) REFERENCES Post (post_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (commenting_user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    CommentHeart (
        comment_id VARCHAR(255) NOT NULL,
        hearted_user_id VARCHAR(255) NOT NULL,
        FOREIGN KEY (comment_id) REFERENCES PostComment (comment_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (hearted_user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    SubComment (
        sub_comment_id VARCHAR(255) PRIMARY KEY,
        comment_id VARCHAR(255),
        replying_user_id VARCHAR(255) NOT NULL,
        comment_text TEXT NOT NULL,
        media_link VARCHAR(1000),
        FOREIGN KEY (comment_id) REFERENCES PostComment (comment_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (replying_user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    SubCommentHeart (
        sub_comment_id VARCHAR(255) NOT NULL,
        hearted_user_id VARCHAR(255) NOT NULL,
        FOREIGN KEY (sub_comment_id) REFERENCES SubComment (sub_comment_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (hearted_user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    GroupChanel (
        group_id VARCHAR(255) PRIMARY KEY,
        group_name VARCHAR(255) NOT NULL,
        group_privacy INT DEFAULT 1,
        group_slogan VARCHAR(1000),
        avatar_media_link VARCHAR(1000) NOT NULL,
        cover_media_link VARCHAR(1000) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    GroupMember (
        member_id VARCHAR(255) NOT NULL,
        member_status INT DEFAULT 0,
        member_role INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    GroupPost (
        group_post_id VARCHAR(255) PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        member_id VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES Post (post_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (member_id) REFERENCES GroupMember (member_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    PrivateMessage (
        messenger_id VARCHAR(255) PRIMARY KEY,
        private_room_id VARCHAR(255),
        content_text TEXT,
        media_link VARCHAR(1000),
        content_type VARCHAR(255) DEFAULT 'text',
        reply_to_id VARCHAR(255),
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    GroupMessage (
        group_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        content_text TEXT,
        media_link VARCHAR(1000),
        content_type VARCHAR(255) DEFAULT 'text',
        reply_to_id VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES GroupChanel (group_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES GroupMember (member_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    Marketplace (
        marketplace_product_id VARCHAR(255) PRIMARY KEY,
        seller_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_description VARCHAR(1000) NOT NULL,
        product_price DECIMAL(9, 0) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        product_location VARCHAR(1000) NOT NULL,
        product_longitude VARCHAR(1000) NOT NULL,
        product_latitude VARCHAR(1000) NOT NULL,
        FOREIGN KEY (seller_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    MarketplaceMedia (
        marketplace_product_id VARCHAR(255),
        media_link VARCHAR(1000) NOT NULL,
        FOREIGN KEY (marketplace_product_id) REFERENCES Marketplace (marketplace_product_id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    EmailOTP (
        user_email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(5) NOT NULL,
        otp_expiration DATETIME NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    Token (
        user_id VARCHAR(255) NOT NULL,
        token VARCHAR(1000) NOT NULL,
        token_expiration DATETIME NOT NULL,
        token_key_encode VARCHAR(1000) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
    );