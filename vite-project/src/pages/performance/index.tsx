import { useState, useRef } from "react";

const rowHeight = 50; // 每项高度
const total = 10000;  // 数据总数
const visibleCount = 9;
const data = Array.from({ length: total }, (_, i) => `Item ${i + 1}`);

export default function VirtualList() {
    const [start, setStart] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const scrollTop = containerRef.current.scrollTop;
        const newStart = Math.floor(scrollTop / rowHeight);
        setStart(newStart);
    };

    const end = start + visibleCount;
    const visibleData = data.slice(start, end);

    return (
        <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
            height: rowHeight * visibleCount,
            overflowY: "auto",
            border: "1px solid #ccc",
            position: "relative",
        }}
        >
        {/* 大容器：撑起滚动条 */}
        <div style={{ height: total * rowHeight, position: "relative" }}>
            {/* 可视区元素 */}
            {visibleData.map((item, i) => (
            <div
                key={item}
                style={{
                position: "absolute",
                top: (start + i) * rowHeight,
                height: rowHeight,
                lineHeight: `${rowHeight}px`,
                borderBottom: "1px solid #eee",
                boxSizing: "border-box",
                width: "100%",
                }}
            >
                {item}
            </div>
            ))}
        </div>
        </div>
    );
}