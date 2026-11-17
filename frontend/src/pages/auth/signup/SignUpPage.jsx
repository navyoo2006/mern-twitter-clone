import { Link } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import XSvg from "../../../components/svgs/X";

import { MdOutlineMail } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { MdPassword } from "react-icons/md";
import { MdDriveFileRenameOutline } from "react-icons/md";

const SignUpPage = () => 
{
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState({
		email: "",
		username: "",
		fullName: "",
		password: "",
  });

	const { mutate, isError, isPending, error } = useMutation({
		mutationFn: async ({ email, username, fullName, password }) => 
		{
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, username, fullName, password }),
			});
			const responseBody = await res.text();
			let data;

			if (responseBody) 
			{
				try 
				{
					data = JSON.parse(responseBody);
				} 
				catch (error)
				{
					if (res.ok) 
					{
						console.log(error);
						throw new Error("The signup server returned an invalid response.");
					}
				}
			}

			if (!res.ok) 
			{
				const message =
					data?.error ||
					(res.status === 502 || res.status === 503
						? "Signup service is unavailable. Make sure the backend server is running."
						: `Failed to sign up (HTTP ${res.status}).`);
				throw new Error(message);
			}

			if (!data) 
			{
				throw new Error("The signup server returned an empty response.");
			}

			if (data.error) 
			{
				throw new Error(data.error);
			}

			return data;
		},
		onSuccess: (user) => {
			queryClient.setQueryData(["authUser"], user);
			toast.success("Account created successfully");
		},
		onError: (error) => toast.error(error.message),
	});

	const handleSubmit = (e) => {
		e.preventDefault(); // page won't reload on form submission
		mutate(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen px-10'>

			<div className='flex-1 hidden lg:flex items-center  justify-center'>
				<XSvg className=' lg:w-2/3 fill-white' />
			</div>

			<div className='flex-1 flex flex-col justify-center items-center'>

				<form className='lg:w-2/3  mx-auto md:mx-20 flex gap-4 flex-col' onSubmit={handleSubmit}>
					<XSvg className='w-24 self-center lg:hidden fill-white' />

					<h1 className='text-4xl font-extrabold text-white'>Join today</h1>

					<label className='input input-bordered w-full rounded flex items-center gap-2'>

						<MdOutlineMail />

						<input
							type='email'
							className='grow'
							placeholder='Email'
							name='email'
							onChange={handleInputChange}
							value={formData.email}
						/>

					</label>

					<label className='input input-bordered w-full rounded flex items-center gap-2'>
						<FaUser />

						<input
							type='text'
							className='grow'
							placeholder='Username'
							name='username'
							onChange={handleInputChange}
							value={formData.username}
						/>

					</label>

					<label className='input input-bordered w-full rounded flex items-center gap-2'>

						<MdDriveFileRenameOutline />
						<input
							type='text'
							className='grow'
							placeholder='Full Name'
							name='fullName'
							onChange={handleInputChange}
							value={formData.fullName}
						/>

					</label>
					<label className='input input-bordered w-full rounded flex items-center gap-2'>
						<MdPassword />
						<input
							type='password'
							className='grow'
							placeholder='Password'
							name='password'
							onChange={handleInputChange}
							value={formData.password}
						/>

					</label>

					<button className='btn rounded-full btn-primary text-white'>{isPending ? "Loading..." : "Sign up"}</button>
					{isError && <p className='text-red-500'>{error.message}</p>}

				</form>
				<div className='flex flex-col lg:w-2/3 gap-2 mt-4'>
					<p className='text-white text-lg'>Already have an account?</p>

					<Link to='/login'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full'>Sign in</button>

					</Link>
				</div>
			</div>
		</div>
	);
};

export default SignUpPage;