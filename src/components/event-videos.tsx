const EVENT_VIDEOS = [
  {
    title: "Elektrisch laden",
    href: "https://youtube.com/shorts/hj-eZ6vmbAo?feature=share",
  },
  {
    title: "Velopresso Vastsnoeren",
    href: "https://youtube.com/shorts/lnBcVNuieME?feature=share",
  },
  {
    title: "Manueel laden in gehuurde camionette",
    href: "https://youtube.com/shorts/a2NxGLjI6Lc",
  },
  {
    title: "Water bijpompen",
    href: "https://youtube.com/shorts/Jst2C5wjsXk?feature=share",
  },
] as const;

export function EventVideos() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-[24px] font-bold text-[#0366c5]">
        Bekijk deze video&apos;s nog eens voor je deze acties gaat uitvoeren.
      </h2>
      <ul className="flex flex-col gap-1">
        {EVENT_VIDEOS.map((video) => (
          <li key={video.href}>
            <a
              href={video.href}
              target="_blank"
              rel="noreferrer"
              className="font-heading text-[20px] font-bold text-[#0366c5] hover:underline"
            >
              {video.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}