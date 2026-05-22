import { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";

export type GraphNode = SimulationNodeDatum & {
  slug: string;
  title: string;
  page_type: string; // concept, entity, topic, source
  degree?: number;
};

export type GraphLink = SimulationLinkDatum<GraphNode> & {
  from: string;
  to: string;
};

export type NodeInput = {
  slug: string;
  title: string;
  page_type: string;
};
