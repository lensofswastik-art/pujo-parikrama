"use client";

import { useMemo } from "react";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { Typeahead, TypeaheadItem } from "@astryxdesign/core/Typeahead";
import type { SearchableItem, SearchSource } from "@astryxdesign/core/Typeahead";
import { AREAS, LOCALITIES, METRO_STATIONS, type Area } from "@/data/parikramas";
import { PANDALS } from "@/data/pandals";
import { ILocate } from "./Icons";

export type Pick =
  | { kind: "area"; area: Area }
  | { kind: "pandal"; id: string }
  | { kind: "here" };

type PlaceItem = SearchableItem<{ pick: Pick; sub: string; group: string }>;

interface Props {
  activeAreaId: string | null;
  category: "metro" | "area";
  onCategoryChange: (c: "metro" | "area") => void;
  onPick: (p: Pick) => void;
}

const areaItem = (a: Area): PlaceItem => ({
  id: a.id,
  label: a.label,
  auxiliaryData: { pick: { kind: "area", area: a }, sub: a.bn, group: a.kind === "metro" ? "Metro stations" : "Areas" },
});

const ALL_ITEMS: PlaceItem[] = [
  ...AREAS.map(areaItem),
  ...PANDALS.map((p) => ({
    id: `p:${p.id}`,
    label: p.name,
    auxiliaryData: { pick: { kind: "pandal", id: p.id } as Pick, sub: p.locality, group: "Pandals" },
  })),
];

/** One search field + Metro/Area switch, with the matching places as quick picks below. */
export default function SearchBar({ activeAreaId, category, onCategoryChange, onPick }: Props) {
  const source: SearchSource<PlaceItem> = useMemo(() => ({
    bootstrap: () => (category === "metro" ? METRO_STATIONS : LOCALITIES).map(areaItem),
    search: (q: string) => {
      const t = q.trim().toLowerCase();
      return ALL_ITEMS.filter((i) => `${i.label} ${i.auxiliaryData?.sub ?? ""}`.toLowerCase().includes(t)).slice(0, 12);
    },
  }), [category]);

  const quickPicks = category === "metro" ? METRO_STATIONS : LOCALITIES;

  return (
    <VStack gap={2}>
      <HStack gap={2} align="center" className="search-row">
        <HStack className="search-field" align="center" gap={1}>
          <Typeahead<PlaceItem>
            label="Starting point"
            isLabelHidden
            placeholder="Search a station, area or pandal"
            searchSource={source}
            value={null}
            hasClear={false}
            onChange={(item) => {
              const pick = item?.auxiliaryData?.pick;
              if (pick) onPick(pick);
            }}
            hasEntriesOnFocus
            debounceMs={0}
            size="lg"
            width="100%"
            controlClassName="search-control"
            startIcon={<Icon icon="search" />}
            emptySearchText="No station, area or pandal matches that."
            renderItem={(item) => (
              <TypeaheadItem item={item} description={item.auxiliaryData?.sub} group={item.auxiliaryData?.group} />
            )}
          />
          <IconButton label="Use my current location" variant="ghost" size="lg"
            icon={<Icon icon={ILocate} />} onClick={() => onPick({ kind: "here" })} />
        </HStack>
        <HStack className="search-toggle">
          <SegmentedControl label="Start from" value={category} layout="fill" size="lg"
            onChange={(v) => onCategoryChange(v as "metro" | "area")}>
            <SegmentedControlItem value="metro" label="Metro" />
            <SegmentedControlItem value="area" label="Area" />
          </SegmentedControl>
        </HStack>
      </HStack>

      <HStack gap={1.5} className="capsules" role="group" aria-label={category === "metro" ? "Metro stations" : "Areas"}>
        {quickPicks.map((a) => (
          <ToggleButton key={a.id} label={a.label} size="sm"
            isPressed={activeAreaId === a.id}
            onPressedChange={() => onPick({ kind: "area", area: a })} />
        ))}
      </HStack>
    </VStack>
  );
}
