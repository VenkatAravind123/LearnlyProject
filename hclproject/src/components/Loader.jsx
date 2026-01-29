import "./loader.css";

export default function Loader({
    size = 50,
    color = "#25b09b",
    className = "",
    style = {},
    label = "Loading",
}) {
    const safeSize = Number.isFinite(Number(size)) ? Number(size) : 50;

    return (
        <div
            className={`loader ${className}`.trim()}
            role="status"
            aria-label={label}
            style={{
                ...style,
                "--loader-size": `${safeSize}px`,
                "--loader-color": color,
            }}
        />
    );
}