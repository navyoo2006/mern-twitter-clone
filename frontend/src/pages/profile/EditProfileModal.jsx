import { useRef, useState } from "react";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";

const EditProfileModal = ({ authUser }) =>
{
	const dialogRef = useRef(null);
	const initialFormData = () => ({
		fullName: authUser?.fullName ?? "",
		username: authUser?.username ?? "",
		email: authUser?.email ?? "",
		bio: authUser?.bio ?? "",
		link: authUser?.link ?? "",
		newPassword: "",
		currentPassword: "",
	});
	const [formData, setFormData] = useState(initialFormData);

	const {updateProfile, isUpdatingProfile } = useUpdateUserProfile();

	const handleInputChange = (e) => 
    {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};


	return (
		<>
			<button
				className='btn btn-outline rounded-full btn-sm border-slate-500 bg-slate-800 text-slate-100 hover:border-slate-400 hover:bg-slate-700 hover:text-white'
				onClick={() => { setFormData(initialFormData()); dialogRef.current.showModal(); }}
			>

				Edit profile

			</button>
			
            <dialog ref={dialogRef} id='edit_profile_modal' className='modal'>
                
				<div className='modal-box border rounded-md border-[#2f3336] bg-black text-white shadow-md'>
					<form method='dialog'>
						<button
							className='btn btn-sm btn-circle btn-ghost absolute left-2 top-2 text-white hover:bg-neutral-800'
							aria-label='Close update profile'
						>
							<span aria-hidden='true'>✕</span>
						</button>
					</form>
					<h3 className='font-bold text-lg my-3 px-8'>Update Profile</h3>
					
                    <form
						className='flex flex-col gap-4'
						onSubmit={async (e) => {
							e.preventDefault();
							try {
								await updateProfile(formData);
								dialogRef.current?.close();
							} catch { /* The mutation displays the error and preserves the form. */ }
						}}
					>

						<div className='flex flex-wrap gap-2'>
							<input
								type='text'
								placeholder='Full Name'
								className='min-w-0 flex-1 input border border-[#333639] rounded bg-black p-2 text-white placeholder:text-neutral-400 input-md'
								value={formData.fullName}
								name='fullName'
								onChange={handleInputChange}
							/>

							<input
								type='text'
								placeholder='Username'
								className='min-w-0 flex-1 input border border-[#333639] rounded bg-black p-2 text-white placeholder:text-neutral-400 input-md'
								value={formData.username}
								name='username'
								onChange={handleInputChange}
							/>

						</div>

						<div className='flex flex-wrap gap-2'>
							<input
								type='email'
								placeholder='Email'
								className='min-w-0 flex-1 input border border-[#333639] rounded bg-black p-2 text-white placeholder:text-neutral-400 input-md'
								value={formData.email}
								name='email'
								onChange={handleInputChange}
							/>

						</div>

						<textarea
							placeholder='Bio'
							className='textarea w-full min-h-24 field-sizing-content resize-none whitespace-pre-wrap [overflow-wrap:anywhere] border border-[#333639] rounded bg-black p-2 text-base leading-relaxed text-white placeholder:text-neutral-400'
							value={formData.bio}
							name='bio'
							onChange={handleInputChange}
						/>

						<div className='flex flex-wrap gap-2'>
							
                            <input
								type='password'
								placeholder='Current Password'
								className='min-w-0 flex-1 input border border-[#333639] rounded bg-black p-2 text-white placeholder:text-neutral-400 input-md'
								value={formData.currentPassword}
								name='currentPassword'
								onChange={handleInputChange}
							/>

							<input
								type='password'
								placeholder='New Password'
								className='min-w-0 flex-1 input border border-[#333639] rounded bg-black p-2 text-white placeholder:text-neutral-400 input-md'
								value={formData.newPassword}
								name='newPassword'
								onChange={handleInputChange}
							/>

						</div>

						<input
							type='text'
							placeholder='Link'
							className='input w-full border border-[#333639] rounded bg-black p-2 text-white placeholder:text-neutral-400 input-md'
							value={formData.link}
							name='link'
							onChange={handleInputChange}
						/>

						<button disabled={isUpdatingProfile} className='btn btn-primary rounded-full btn-sm text-white'>{isUpdatingProfile ? "Updating..." : "Update"}

						</button>
					
                    </form>

				</div>
				
                <form method='dialog' className='modal-backdrop'>
					<button className='outline-none'>close</button>
				</form>

			</dialog>
		</>
	);
};

export default EditProfileModal;