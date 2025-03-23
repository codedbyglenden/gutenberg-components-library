import React from 'react';

interface HeroBlockProps {
	title: string;
	subtitle?: string;
	backgroundImage?: string;
	alignment?: 'left' | 'center' | 'right';
}

const HeroBlock = ({
	title,
	subtitle,
	backgroundImage,
	alignment = 'center'
}: HeroBlockProps) => {
	return (
		
		<div>
			{title}
		</div>
	);
};

export default HeroBlock;