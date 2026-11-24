import { FaRegComment } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../../utils/date";

const Post = ({ post }) => 
{
	const [comment, setComment] = useState("");
	const queryClient = useQueryClient();
	const authUser = queryClient.getQueryData(["authUser"]);
	
	const postOwner = post.user;
	const isLiked = Boolean(authUser && post.likes.includes(authUser._id));

	const isMyPost = authUser?._id === post.user?._id;

	const formattedDate = formatPostDate(post.createdAt);

	const {mutate:deletePost, isPending:isDeleting} = useMutation ({
		mutationFn: async () =>
		{
			try
			{
				const res = await fetch(`/api/posts/${post._id}`, 
				{
					method: "DELETE",
				});

				const data = await res.json();

				if(!res.ok)
				{
					throw new Error(data.error || "Error deleting post");
				}
			}
			catch(error)
			{
				throw new Error(error.message || "Error deleting post");

			}
		},
		onSuccess: () =>
		{
			toast.success("Post deleted successfully");

			//invalidate the query to refetch the data

			queryClient.invalidateQueries({queryKey: ["posts"]});
			queryClient.invalidateQueries({queryKey: ["userProfile"]});

		}
	})

	const {mutate:likePost, isPending:isLiking} = useMutation(
	{
		mutationFn: async () => 
		{
			try
			{
				const res = await fetch(`/api/posts/like/${post._id}`, 
				{
					method: "POST",
				});

				const data = await res.json();

				if(!res.ok)
				{
					throw new Error(data.error || "Something went wrong")
				}
				return data;
			}
			catch(error)
			{
				throw new Error(error)
			}
		},

		onSuccess:(updatedLikes) =>
		{
			queryClient.setQueriesData({ queryKey: ["posts"] }, oldData =>
			{
				if (!Array.isArray(oldData))
				{
					return oldData;
				}

				return oldData.map(p => 
				{
					if(p._id === post._id)
					{
						return {...p, likes:updatedLikes}
					}
					return p;
				});
			});

			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError:(error) =>
		{
			toast.error(error.message)
		}
	})

	const { mutate: commonPost, isPending: isCommenting } = useMutation(
	{
		mutationFn: async () => 
		{
			try
			{
				const res = await fetch(`/api/posts/comment/${post._id}`, 
				{
					method: "POST",
					headers:
					{
						"Content-Type": "application/json",
					},

					body: JSON.stringify({ text: comment }),
				})

				const data = await res.json();

				if(!res.ok)
				{
					throw new Error(data.error || "Something went wrong")
				}
				return data;
			}
			catch(error)
			{
				throw new Error(error)
			}
		},

		onSuccess: () =>
		{
			toast.success("Comment posted successfully");
			setComment("");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},

		onError:(error) =>
		{
			toast.error(error.message)
		}
	})

	const handleDeletePost = () => 
	{
		deletePost();

	};

	const handlePostComment = (e) => 
    {
		e.preventDefault();
		if (isCommenting)
		{
			return;
		}
		commonPost();
	};

	const handleLikePost = () => 
	{
		if(isLiking)
		{
			return;
		}

		likePost();
	};

	return (
		<>
			<div className='flex gap-2 items-start p-4 border-b border-gray-700'>

				<div className='avatar'>
					<Link to={`/profile/${postOwner?.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner?.profileImg || "/avatar-placeholder.png"} />
					</Link>

				</div>

				<div className='flex min-w-0 flex-col flex-1 text-left text-white'>
                    
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner?.username}`} className='font-bold'>
							{postOwner?.fullName}
						</Link>

						<span className='text-white flex gap-1 text-sm'>
							<Link to={`/profile/${postOwner?.username}`}>@{postOwner?.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>

						{isMyPost && (
							<span className='flex justify-end flex-1'>
								{!isDeleting && <button type='button' aria-label='Delete post' className='cursor-pointer hover:text-red-500' onClick={handleDeletePost}><FaTrash aria-hidden='true' /></button>}

								{isDeleting && (
									<LoadingSpinner size="sm" />
								)}
							</span>
						)}

					</div>

					<div className='flex flex-col gap-3 overflow-hidden'>
						<span className='whitespace-pre-wrap break-words'>{post.text}</span>
						{post.img && (
							<img
								src={post.img}
								className='max-w-full max-h-96 object-contain self-start rounded-lg border border-gray-700'
								alt={post.imgAlt || ''}
							/>
						)}

					</div>

					<div className='flex items-center justify-between gap-2 mt-3'>
						<div className='flex flex-1 min-w-0 gap-2 items-center justify-between'>
							<div
								className='flex gap-1 items-center cursor-pointer group'
								onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-white group-hover:text-sky-400' />
								<span className='text-sm text-white group-hover:text-sky-400'>
									{post.comments.length}
								</span>
							</div>

							{/* The Modal Component from DaisyUI */}
							<dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>

								<div className='modal-box rounded border border-[#333639] bg-black text-white'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{post.comments.length === 0 && (
											<p className='text-sm text-white'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}

										{post.comments.map((comment) => (
											<div key={comment._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment.user?.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>

												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment.user?.fullName || "Deleted user"}</span>
														<span className='text-white text-sm'>
															@{comment.user?.username || "deleted"}
														</span>
													</div>
													<div className='text-sm'>{comment.text}</div>
												</div>
											</div>

										))}

									</div>

									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>

										<textarea
											className='textarea min-w-0 w-full p-2 rounded text-md resize-none border border-[#333639] bg-black text-white placeholder:text-neutral-400 focus:outline-sky-500'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>

										<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
											{isCommenting ? <LoadingSpinner size='md' /> : "Post"}
										</button>

									</form>

								</div>

								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>

							</dialog>

							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking &&<LoadingSpinner size='sm' />}
								{!isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-white group-hover:text-pink-500' />
								)}
								{isLiked && !isLiking && <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />}

								<span
									className={`text-sm group-hover:text-pink-500 ${
										isLiked ? "text-pink-500" : "text-white"
									}`}
								>
									{post.likes.length}
								</span>

							</div>

						</div>

					</div>
				</div>
			</div>
		</>
	);
};

export default Post;