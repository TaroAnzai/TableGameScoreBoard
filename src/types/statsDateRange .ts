export type DateString = `${number}-${number}-${number}`;

export type StatsDateRange =
  | {
      type: 'all';
      startDate: null;
      endDate: null;
    }
  | {
      type: 'range';
      startDate: DateString;
      endDate: DateString;
    };
