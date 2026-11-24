import { useState } from "react";
import { Link } from "react-router-dom";

import XSvg from "../../../components/svgs/X";

import { FaUser } from "react-icons/fa";
import { MdPassword } from "react-icons/md";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const LoginPage = () => 
{
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	const {mutate:loginMutation, isPending, isError, error} = useMutation({
		mutationFn: async ({ username, password }) => 
		{
			const res = await fetch("/api/auth/login", 
			{
				method: "POST",
				headers: 
				{
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});
			const responseBody = await res.text();
			let data;

			if (responseBody) 
			{
				try 
				{
					data = JSON.parse(responseBody);
				} 
				catch 
				{
					if (res.ok) 
					{
						throw new Error("The login server returned an invalid response.");
					}
				}
			}

			if (!res.ok) 
			{
				const message =
					data?.error ||
					(res.status === 502 || res.status === 503
						? "Login service is unavailable. Make sure the backend server is running."
						: `Failed to login (HTTP ${res.status}).`);
				throw new Error(message);
			}

			if (!data) 
			{
				throw new Error("The login server returned an empty response.");
			}

			if (data.error) 
			{
				throw new Error(data.error);
			}

			return data;
		},
		onSuccess: (user) => 
		{
			queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "authUser" });
			queryClient.setQueryData(["authUser"], user);
			toast.success("Login successful!");
		},
		onError: (error) => toast.error(error.message),
	});

	const handleSubmit = (e) => 
	{
		e.preventDefault();
		loginMutation(formData);
	};

	const handleInputChange = (e) => 
	{
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen'>

			<div className='flex-1 hidden lg:flex items-center  justify-center'>
				<XSvg className='lg:w-2/3 fill-white' />
			</div>

			<div className='flex-1 flex flex-col justify-center items-center'>

				<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
					<XSvg className='w-24 self-center lg:hidden fill-white' />

					<h1 className='text-4xl font-extrabold text-white'>Welcome back</h1>

					<label className='input input-bordered rounded flex items-center gap-2 border border-[#333639] bg-black text-neutral-200 focus-within:border-[#1d9bf0] focus-within:outline-[#1d9bf0]'>
						<FaUser />

						<input
							type='text'
							className='grow bg-transparent text-white placeholder:text-neutral-400'
							placeholder='Username'
							name='username'
							onChange={handleInputChange}
							value={formData.username}
						/>

					</label>

					<label className='input input-bordered rounded flex items-center gap-2 border border-[#333639] bg-black text-neutral-200 focus-within:border-[#1d9bf0] focus-within:outline-[#1d9bf0]'>

						<MdPassword />

						<input
							type='password'
							className='grow bg-transparent text-white placeholder:text-neutral-400'
							placeholder='Password'
							name='password'
							onChange={handleInputChange}
							value={formData.password}
						/>

					</label>

					<button disabled={isPending} className='btn rounded-full btn-primary text-white'>{isPending ? "Logging in..." : "Login"}</button>
					{isError && <p className='text-red-500'>{error.message}</p>}
				</form>

				<div className='flex flex-col gap-2 mt-4'>

					<p className='text-white text-lg'>{"Don't"} have an account?</p>

					<Link to='/signup'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full'>Sign up</button>
					</Link>

				</div>
			</div>
		</div>
	);
};

export default LoginPage;