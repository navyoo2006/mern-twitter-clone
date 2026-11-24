import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

const useUpdateUserProfile = () => 
{
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const {mutateAsync:updateProfile, isPending:isUpdatingProfile} = useMutation(
	{
		mutationFn: async (formData) => 
		{
			try
			{
				const res = await fetch("/api/users/update",

				{
					method: "POST",
					headers: 
					{
						"Content-Type": "application/json",
					},

					body: JSON.stringify(formData),
				})

					const data = await res.json()

					if(!res.ok)
					{
						throw new Error(data.error || "Something went wrong");
					}
					
					return data;

			}

			catch(error)
			{
				throw new Error(error.message);
			}
		},

		onMutate: () => ({ userId: queryClient.getQueryData(["authUser"])?._id }),
		onSuccess: async (user, formData, context) =>
		{
			const previousUser = queryClient.getQueryData(["authUser"]);
			if (!previousUser || previousUser._id !== context.userId) return;
			queryClient.setQueryData(["authUser"], user);
			if (previousUser?.username !== user.username && pathname === `/profile/${previousUser?.username}`)
			{
				navigate(`/profile/${user.username}`, { replace: true });
			}
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
				queryClient.invalidateQueries({ queryKey: ["posts"] }),
				queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
			]);
			toast.success("Profile updated successfully");
		},

		onError: (error) => 
		{
			toast.error(error.message);
		},
	});

    return {updateProfile, isUpdatingProfile}

}


export default useUpdateUserProfile
