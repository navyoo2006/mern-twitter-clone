import useAuthUser from "../../../hooks/useAuthUser";
import { CiImageOn } from "react-icons/ci";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";

const CreatePost = () => 
{
	const [text, setText] = useState("");
	const [img, setImg] = useState(null);
	const imgRef = useRef(null);
	const textRef = useRef(null);

	const {data:authUser} = useAuthUser();
	const queryClient = useQueryClient();

	const {mutate:createPost, isPending, isError, error} = useMutation({
		mutationFn: async ({text,img}) =>
		{
			try
			{
				const res = await fetch("/api/posts/create",
				{
					method: "POST",
					headers: 
					{
						"Content-Type": "application/json",
					},
					body: JSON.stringify({text,img}),
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
				throw new Error(error.message)

			}
		},

		onSuccess: () =>
		{
			setText("");
			setImg(null);
			toast.success("Post created successfully");
			
			//invalidate query to update the UI
			queryClient.invalidateQueries({queryKey: ['posts']});
			queryClient.invalidateQueries({queryKey: ['userProfile']});

		}
	})

	const handleSubmit = (e) => 
	{
		e.preventDefault();
		createPost({text, img});
	};

	const handleEmojiSelect = (emoji) =>
	{
		const textarea = textRef.current;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		setText(text.slice(0, start) + emoji + text.slice(end));
		requestAnimationFrame(() =>
		{
			textarea.focus();
			textarea.setSelectionRange(start + emoji.length, start + emoji.length);
		});
	};

	const handleImgChange = (e) => 
  {
		const file = e.target.files[0];
		
    if (file) 
    {
			const reader = new FileReader();
			reader.onload = () => 
      {
				setImg(reader.result);
			};

			reader.readAsDataURL(file);
		}

	};

	return (
		<div className='flex p-4 items-start gap-4 border-b border-gray-700'>

			<div className='avatar'>
				<div className='w-8 rounded-full'>
					<img src={authUser.profileImg || "/avatar-placeholder.png"} />

				</div>
        
			</div>

			<form className='group flex min-w-0 flex-1 flex-col gap-2' onSubmit={handleSubmit}>

				<textarea
					ref={textRef}
					className='block min-h-28 w-full field-sizing-content resize-none border-0 bg-transparent px-3 pt-4 pb-3 text-left text-xl leading-relaxed text-white placeholder:text-neutral-400 shadow-none outline-none focus:outline-none focus:ring-0'
					placeholder='What is happening?!'
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>

				{img && (
					<div className='relative mx-auto w-full max-w-72'>

						<IoCloseSharp
							className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
							onClick={() => {
								setImg(null);
								imgRef.current.value = null;
							}}
						/>

						<img src={img} className='w-full mx-auto h-72 object-contain rounded' />

					</div>

				)}

				<div className='flex items-center justify-between border-t border-[#2f3336] py-2 transition-colors group-focus-within:border-[#1d9bf0]'>

					<div className='flex gap-1 items-center'>

						<CiImageOn
							className='fill-primary w-6 h-6 cursor-pointer'
							onClick={() => imgRef.current.click()}
						/>

						<EmojiPicker onSelect={handleEmojiSelect} />
					</div>

					<input type='file' accept='image/*' hidden ref={imgRef} onChange={handleImgChange} />

					<button disabled={isPending} className='btn btn-primary rounded-full btn-sm text-white px-4'>
						{isPending ? "Posting..." : "Post"}
					</button>
          
				</div>

				{isError && <div className='text-center text-sm leading-relaxed text-red-500'>
				{error.message}
				</div>}
			</form>
		</div>
	);
};

export default CreatePost;