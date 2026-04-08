type CrewPageClientProps = {
  crewId: string;
};

export function CrewPageClient({ crewId }: CrewPageClientProps) {
  return (
    <main>
      <h1>Crew</h1>
      <p>Crew ID: {crewId}</p>
    </main>
  );
}
