import useAuthUser from "../../hooks/useAuthUser";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { IoMenuOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import LoadingSpinner from "../../components/svgs/common/LoadingSpinner";

const NotificationPage = () => {
    const queryClient = useQueryClient();
    const menuRef = useRef(null);
    const { data: authUser } = useAuthUser();
    const { data: notifications = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ["notifications", authUser?._id],
        queryFn: async ({ signal }) => {
            const res = await fetch("/api/notifications", { signal });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unable to load notifications");
            return data;
        },
    });
    const { mutate: deleteNotifications, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/notifications", { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unable to clear notifications");
            return data;
        },
        onSuccess: async () => {
            if (menuRef.current) menuRef.current.open = false;
            await queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Notifications cleared successfully");
        },
        onError: (failure) => toast.error(failure.message),
    });
    return (
        <div className='min-w-0 flex-1 border-r border-[#2f3336] min-h-screen text-white'>
            <div className='flex justify-between items-center p-4 border-b border-[#2f3336]'>
                <p className='font-bold'>Notifications</p>
                <details ref={menuRef} className='dropdown dropdown-end'
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            menuRef.current.open = false;
                            menuRef.current.querySelector("summary").focus();
                        }
                    }}
                    onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) menuRef.current.open = false;
                    }}
                >
                    <summary aria-label='Notification menu' className='btn btn-ghost btn-circle cursor-pointer list-none text-white hover:bg-neutral-800 [&::-webkit-details-marker]:hidden'>
                        <IoMenuOutline className='h-6 w-6' aria-hidden='true' />
                    </summary>
                    <ul className='dropdown-content z-20 menu mt-2 w-60 rounded-xl border border-[#333639] bg-black p-2 text-white shadow-xl'>
                        <li><button type='button' disabled={isDeleting} onClick={() => deleteNotifications()} className='cursor-pointer text-white hover:bg-neutral-800 focus:bg-neutral-800'>
                            {isDeleting ? "Clearing..." : "Delete all notifications"}
                        </button></li>
                    </ul>
                </details>
            </div>
            {isLoading && <div className='flex justify-center p-8'><LoadingSpinner size='lg' /></div>}
            {isError && <div role='alert' className='p-4'>{error.message} <button type='button' className='cursor-pointer underline' onClick={() => refetch()}>Retry</button></div>}
            {!isLoading && !isError && notifications.length === 0 && <div className='text-center p-4 font-bold'>No notifications</div>}
            {notifications.filter((notification) => notification.from).map((notification) => (
                <div className='border-b border-[#2f3336]' key={notification._id}>
                    <div className='flex gap-3 p-4'>
                        {notification.type === "follow" ? <FaUser className='w-7 h-7 text-primary' /> : <FaHeart className='w-7 h-7 text-pink-500' />}
                        <Link to={`/profile/${notification.from.username}`} className='flex min-w-0 items-center gap-3 text-left'>
                            <div className='avatar'><div className='w-8 rounded-full'><img src={notification.from.profileImg || "/avatar-placeholder.png"} alt='' /></div></div>
                            <span className='break-words'><span className='font-bold'>@{notification.from.username}</span> {notification.type === "follow" ? "followed you" : "liked your post"}</span>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationPage;
