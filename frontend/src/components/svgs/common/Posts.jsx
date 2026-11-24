import useAuthUser from "../../../hooks/useAuthUser";
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

	const {data:authUser} = useAuthUser();
	const {data:posts, isLoading, isRefetching, isError, error, refetch} = useQuery({

		queryKey: ["posts", POST_ENDPOINT, authUser?._id],
		queryFn: async ({ signal }) =>
		{
			try
			{
				const res = await fetch(POST_ENDPOINT, { signal });
				const data = await res.json();

				if (!res.ok)
				{
					throw new Error(data.error || "Error fetching posts");
				}

				return data;
			}
			catch(error)
			{
				throw new Error(error.message || "Error fetching posts");
			}

		},
		enabled: feedType !== "likes" || Boolean(userId),
	});

	return (

		<>
			{isError && <div role="alert" className="p-4 text-white">{error.message} <button type="button" className="cursor-pointer underline" onClick={() => refetch()}>Retry</button></div>}
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