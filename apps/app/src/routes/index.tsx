import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import imagesData from "../assets/images.json";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

type ImageItem = {
	n: string; // filename
	w: number; // width
	h: number; // height
};

const COLUMN_COUNT = 4;

function RouteComponent() {
	const parentRef = useRef<HTMLDivElement>(null);
	const images = imagesData as ImageItem[];

	const rowVirtualizer = useVirtualizer({
		count: images.length,
		getScrollElement: () => parentRef.current,
		estimateSize: (i) => images[i].h,
		overscan: 5,
		lanes: COLUMN_COUNT,
	});

	return (
		<div
			ref={parentRef}
			className="w-full h-screen overflow-auto bg-background"
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => (
					<div
						key={virtualRow.index}
						className="absolute p-1 transition-transform"
						style={{
							top: 0,
							left: `${virtualRow.lane * (100 / COLUMN_COUNT)}%`,
							width: `${100 / COLUMN_COUNT}%`,
							height: `${images[virtualRow.index].h}px`,
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						<img
							src={`/assets/${images[virtualRow.index].n}`}
							alt={`Item ${virtualRow.index + 1}`}
							className="w-full h-full object-cover rounded-md shadow-md hover:shadow-lg transition-shadow duration-200"
							loading="lazy"
						/>
					</div>
				))}
			</div>
		</div>
	);
}
