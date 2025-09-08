export interface StateData {
  id: string
  name: string
  capital: string
  abbreviation: string
}

export const northeastStates: StateData[] = [
  { id: "CT", name: "Connecticut", capital: "Hartford", abbreviation: "CT" },
  { id: "DE", name: "Delaware", capital: "Dover", abbreviation: "DE" },
  { id: "ME", name: "Maine", capital: "Augusta", abbreviation: "ME" },
  { id: "MD", name: "Maryland", capital: "Annapolis", abbreviation: "MD" },
  { id: "MA", name: "Massachusetts", capital: "Boston", abbreviation: "MA" },
  { id: "NH", name: "New Hampshire", capital: "Concord", abbreviation: "NH" },
  { id: "NJ", name: "New Jersey", capital: "Trenton", abbreviation: "NJ" },
  { id: "NY", name: "New York", capital: "Albany", abbreviation: "NY" },
  { id: "PA", name: "Pennsylvania", capital: "Harrisburg", abbreviation: "PA" },
  { id: "RI", name: "Rhode Island", capital: "Providence", abbreviation: "RI" },
  { id: "VT", name: "Vermont", capital: "Montpelier", abbreviation: "VT" },
]

export const getStatesByRegion = (region: string): StateData[] => {
  switch (region) {
    case "northeast":
      return northeastStates
    default:
      return []
  }
}