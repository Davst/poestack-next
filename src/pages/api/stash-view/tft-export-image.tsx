/* eslint-disable @next/next/no-img-element */
import client from "poe-stack-apollo-client";

import { gql } from "@apollo/client";
import { StashViewSettings } from "@contexts/stash-view-context";
import { StashViewStashSummary } from "@generated/graphql";
import { GeneralUtils } from "@utils/general-util";
import { StashViewUtil } from "@utils/stash-view-util";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default async function TftExportImage(req) {
  const { searchParams } = new URL(req.url);

  const stashViewSettings: StashViewSettings = JSON.parse(
    searchParams.get("input")!
  );

  const opaqueKey = searchParams.get("opaqueKey");

  const stashSummary: StashViewStashSummary | null =
    await StashViewUtil.fetchMostRecentStashSummary(
      stashViewSettings.league!,
      opaqueKey!
    );
  const items = StashViewUtil.searchItems(
    stashViewSettings,
    stashSummary!,
    true
  )
    .filter((e) => !!e.itemGroupHashString)
    .sort(
      (a, b) =>
        StashViewUtil.itemStackTotalValue(stashViewSettings, b) -
        StashViewUtil.itemStackTotalValue(stashViewSettings, a)
    );

  console.log("items", items.length);
  const cols = Math.ceil(items.length / 15);

  function cleanText(e: string): string {
    return e
      .replaceAll(" Scarab", "")
      .replaceAll("Essence Of ", "")
      .replaceAll("Delirium Orb ", "");
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
        }}
      >
        <div tw="flex flex-col h-full text-white">
          <div tw="flex flex-row">PoeStack Bulk Export</div>
          <div tw="flex flex-1 flex-col flex-wrap">
            {items?.map((igs, i) => (
              <>
                <div key={i} tw="flex flex-row pr-2">
                  <img
                    width="25"
                    height="25"
                    src={igs?.itemGroup?.icon!}
                    alt="x"
                  />
                  <div tw="flex flex-row">
                    x{igs.quantity}{" "}
                    {cleanText(StashViewUtil.itemEntryToName(igs)!)}{" "}
                    {GeneralUtils.roundToFirstNoneZeroN(
                      StashViewUtil.itemValue(stashViewSettings, igs)
                    )}
                    c each
                  </div>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: cols * 320,
      height: 500,
    }
  );
}
