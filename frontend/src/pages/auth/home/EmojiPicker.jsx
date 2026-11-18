import { useEffect, useId, useRef, useState } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";

const EMOJIS = [
	["😀", "Grinning face"], ["😃", "Smiling face"], ["😊", "Happy face"],
	["😂", "Laughing tears"], ["🤣", "Rolling with laughter"], ["🥹", "Holding back tears"],
	["😍", "Heart eyes"], ["🥰", "Smiling with hearts"], ["😘", "Blowing a kiss"],
	["😎", "Sunglasses"], ["🤔", "Thinking"], ["🙃", "Upside down face"],
	["😭", "Crying"], ["😅", "Smiling with sweat"], ["😮", "Surprised"],
	["🥳", "Party face"], ["🤩", "Star eyes"], ["😴", "Sleeping"],
	["👍", "Thumbs up"], ["👎", "Thumbs down"], ["👏", "Clapping"],
	["🙌", "Raised hands"], ["🙏", "Folded hands"], ["👋", "Waving"],
	["❤️", "Red heart"], ["💙", "Blue heart"], ["💜", "Purple heart"],
	["💔", "Broken heart"], ["💯", "Hundred points"], ["🔥", "Fire"],
	["✨", "Sparkles"], ["🎉", "Celebration"], ["🚀", "Rocket"],
	["💻", "Laptop"], ["📸", "Camera"], ["🎵", "Music"],
	["☕", "Coffee"], ["🍕", "Pizza"], ["🌱", "Seedling"],
	["☀️", "Sun"], ["🏀", "Basketball"], ["🎮", "Gaming"],
];

const EmojiPicker = ({ onSelect }) =>
{
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);
	const buttonRef = useRef(null);
	const pickerId = useId();

	useEffect(() =>
	{
		if (!isOpen) return;

		const handlePointerDown = (event) =>
		{
			if (!containerRef.current.contains(event.target)) setIsOpen(false);
		};
		const handleKeyDown = (event) =>
		{
			if (event.key === "Escape")
			{
				setIsOpen(false);
				buttonRef.current.focus();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () =>
		{
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	return (
		<div ref={containerRef} className='relative'>
			<button
				type='button'
				ref={buttonRef}
				className='flex cursor-pointer items-center justify-center rounded-full p-1 hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-sky-500'
				aria-label='Add emoji'
				aria-expanded={isOpen}
				aria-controls={pickerId}
				onClick={() => setIsOpen((open) => !open)}
			>
				<BsEmojiSmileFill className='fill-primary w-5 h-5' aria-hidden='true' />
			</button>
			{isOpen && (
				<div
					id={pickerId}
					role='group'
					aria-label='Choose an emoji'
					className='absolute left-0 top-full z-20 mt-2 grid w-56 max-w-[calc(100vw-7rem)] grid-cols-6 gap-1 rounded-xl border border-[#333639] bg-black p-2 text-white shadow-xl'
				>
					{EMOJIS.map(([emoji, label]) => (
						<button
							key={emoji}
							type='button'
							aria-label={label}
							title={label}
							className='flex h-8 cursor-pointer items-center justify-center rounded text-xl hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-sky-500'
							onClick={() =>
							{
								onSelect(emoji);
								setIsOpen(false);
							}}
						>
							{emoji}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default EmojiPicker;
