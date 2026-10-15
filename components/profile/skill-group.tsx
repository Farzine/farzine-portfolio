import type { Portfolio } from "@/lib/content/public-model";
import { SkillLogo } from "@/components/site/skill-logo";

export function SkillGroup({
  group,
}: {
  group: Portfolio["skillGroups"][number];
}) {
  const logos = group.skills.some((skill) => skill.logoUrl);
  const middle = Math.ceil(group.skills.length / 2);
  const lists = logos
    ? [group.skills]
    : [group.skills.slice(0, middle), group.skills.slice(middle)];
  return (
    <article className="skill-panel">
      <h3>{group.name}</h3>
      <div className={logos ? undefined : "skill-text-columns"}>
        {lists
          .filter((skills) => skills.length)
          .map((skills) => (
            <ul
              key={skills[0].id}
              className={logos ? "skill-logos" : "skill-text"}
            >
              {skills.map((skill) => (
                <li key={skill.id}>
                  {skill.logoUrl ? (
                    <span className="skill-logo">
                      <SkillLogo
                        key={skill.logoUrl}
                        src={skill.logoUrl}
                        name={skill.name}
                      />
                    </span>
                  ) : (
                    skill.name
                  )}
                  {skill.description && (
                    <span className="skill-description">
                      {skill.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </article>
  );
}
