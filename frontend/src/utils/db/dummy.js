export const POSTS = 
[
	{
		_id: "2",
		text: "Found a little coffee shop near work with good coffee and a sunny window seat. I could stay here all afternoon ☕",
		img: "/posts/jane-post.png",
		imgAlt: "A cozy cafe seating area beside a window",
		timeAgo: "18m",
		user: 
        {
			username: "bobdoe",
			profileImg: "/avatars/boy3.png",
			fullName: "Bob Doe",
		},

		comments: 
        [
			{
				_id: "1",
				text: "A sunny window seat makes everything better.",
				user: 
                {
					username: "janedoe",
					profileImg: "/avatars/girl1.png",
					fullName: "Jane Doe",
				},
			},
		],

		likes: ["6658s891", "6658s892", "6658s893", "6658s894"],
	},

	{
		_id: "3",
		text: "Took the long way home and caught the sky looking like this. Definitely worth the extra ten minutes 🌇",
		img: "/posts/bob-post.png",
		imgAlt: "A person looking across a green mountain valley",
		timeAgo: "1h",
		user: 
        {
			username: "janedoe",
			profileImg: "/avatars/girl1.png",
			fullName: "Jane Doe",
		},
		comments: 
        [
			{
				_id: "1",
				text: "That sky is unreal. Glad you stopped to enjoy it!",
				user: 
                {
					username: "bobdoe",
					profileImg: "/avatars/boy3.png",
					fullName: "Bob Doe",
				},
			},
		],
		likes: ["6658s891", "6658s892", "6658s893", "6658s894", "6658s895", "6658s896"],
	},

	{
		_id: "4",
		text: "Tiny work win: finally got my Go API running without errors. Celebrating with a very necessary coffee break 😅",
		img: "/posts/john-post.png",
		imgAlt: "A laptop and a cup of tea on a desk",
		timeAgo: "3h",
		user: 

        {
			username: "johndoe",
			profileImg: "/avatars/boy1.png",
			fullName: "John Doe",
		},

		comments: 
        [
			{
				_id: "1",
				text: "The first clean run always feels so good. Nice work!",
				user: 
                {
					username: "janedoe",
					profileImg: "/avatars/girl1.png",
					fullName: "Jane Doe",
				},
			},
		],

		likes: 
        [
			"6658s891",
			"6658s892",
			"6658s893",
			"6658s894",
			"6658s895",
			"6658s896",
			"6658s897",
			"6658s898",
			"6658s899",
		],
	},
];

export const USERS_FOR_RIGHT_PANEL = 
[
	{
		_id: "1",
		fullName: "John Doe",
		username: "johndoe",
		profileImg: "/avatars/boy2.png",
	},

	{
		_id: "2",
		fullName: "Jane Doe",
		username: "janedoe",
		profileImg: "/avatars/girl1.png",
	},

	{
		_id: "3",
		fullName: "Bob Doe",
		username: "bobdoe",
		profileImg: "/avatars/boy3.png",
	},

	{
		_id: "4",
		fullName: "Daisy Doe",
		username: "daisydoe",
		profileImg: "/avatars/girl2.png",
	},

];