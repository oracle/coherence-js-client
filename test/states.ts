/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

/* test/cache_test.js */

export type StateType = {
  name: string,
  abbreviation: string,
  capital: string,
  tz: string,
  population: number,
  neighbors: string[]
};

export const states = {
  ca: {
    name: "California",
    abbreviation: "CA",
    capital: "Sacramento",
    tz: "Pacific",
    population: 39,    //39.55
    neighbors: ["OR", "NV", "AZ"]
  },
  ny: {
    name: "New York",
    abbreviation: "NY",
    capital: "Albany",
    tz: "Eastern",
    population: 19,   //19.54
    neighbors: ["NJ", "PN", "CT", "MA", "VA"]
  },
  tx: {
    name: "Texas",
    abbreviation: "TX",
    capital: "Austin",
    tz: "Mountain",
    population: 29,   //19.54
    neighbors: ["NJ", "PN", "CT", "MA", "VA"]
  },
};
