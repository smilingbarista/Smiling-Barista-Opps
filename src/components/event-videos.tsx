const EVENT_VIDEOS = [
  {
    title: "Elektrisch laden",
    href: "https://youtube.com/shorts/hj-eZ6vmbAo?feature=share",
    icon: "💙",
  },
  {
    title: "Velopresso Vastsnoeren",
    href: "https://youtube.com/shorts/lnBcVNuieME?feature=share",
    icon: "🚴‍♂️",
  },
  {
    title: "Manueel laden in gehuurde camionette",
    href: "https://youtube.com/shorts/a2NxGLjI6Lc",
    icon: "💙",
  },
  {
    title: "Water bijpompen",
    href: "https://youtube.com/shorts/Jst2C5wjsXk?feature=share",
    icon: "🚴‍♂️",
  },
] as const;

export function EventVideos({
  showLinkInstruction = false,
}: {
  showLinkInstruction?: boolean;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-[24px] font-bold text-[#0366c5]">
        Bekijk deze video&apos;s nog eens voor je deze acties gaat uitvoeren.
      </h2>
      {showLinkInstruction && (
        <p className="font-heading text-[20px] font-bold text-black">
          [klik op de titels om de link te bekijken]
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {EVENT_VIDEOS.map((video) => (
          <li key={video.href}>
            <a
              href={video.href}
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[20px] font-bold text-black hover:underline"
            >
              <span aria-hidden="true">{video.icon} </span>
              {video.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}