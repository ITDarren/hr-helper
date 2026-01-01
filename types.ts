
export interface Participant {
  id: string;
  name: string;
}

export interface Prize {
  id: string;
  name: string;
  quantity: number;
  totalQuantity: number;
}

export interface Winner {
  participant: Participant;
  prize: string;
  timestamp: number;
}

export interface Group {
  id: string;
  name: string;
  members: Participant[];
}

export enum ToolMode {
  MANAGE = 'MANAGE',
  RAFFLE = 'RAFFLE',
  GROUPING = 'GROUPING'
}
