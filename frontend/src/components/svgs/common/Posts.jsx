import { useQuery } from "@tanstack/react-query";
import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";

const Posts = ({feedType, username, userId}) =>
{	
	const getPostEndpoint = () => 
	{
		switch (feedType)
		{
			case `for-you`:
				return `/api/posts/all`;
			case `following`:
				return `/api/posts/following`;
			case `posts`:
				return `/api/posts/user/${username}`;
			case `likes`:
				return `/api/posts/likes/${userId}`;
			default:
				return `/api/posts/all`;
		}
	};

	const POST_ENDPOINT = getPostEndpoint();

	const {data:posts, isLoading, isRefetching} = useQuery({

		queryKey: ["posts", POST_ENDPOINT],
		queryFn: async () =>
		{
			try
			{
				const res = await fetch(POST_ENDPOINT);
				const data = await res.json();

				if (!res.ok)
				{
					throw new Error(data.message || "Error fetching posts");
				}

				return data;
			}
			catch(error)
			{
				throw new Error("Error fetching posts");
			}

		},
		enabled: feedType !== "likes" || Boolean(userId),
	});

	return (

		<>
			{(isLoading || isRefetching) && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}

			{!isLoading && !isRefetching && posts?.length === 0 && <p className='text-center my-4'>No posts in this tab. Switch 👻</p>}

			{!isLoading && !isRefetching && posts && (

				<div>
					{posts.map((post) => (
						<Post key={post._id} post={post} />
					))}
				</div>

			)}

		</>
	);
};

export default Posts;