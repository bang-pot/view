export type CrewVisibility = "PUBLIC" | "PRIVATE";

export type CrewCreateInput = {
  name: string;
  description: string | null;
  visibility: CrewVisibility;
  imageUrl: string | null;
};

export type CrewCreateResponse = {
  crewId: number;
  name: string;
  myRole: string;
};
