// Section markup originally derived from the futureoffinance template; content is Bunnies.
import { StatusTags, StockSearch } from "../Widgets";

export function Hero() {
  return (
    <div className="pwb-flex-grid-wrap" id="i84ba">
      <div className="pwb-flex-grid-wrap" id="i1lwz">
        <div className="pwb-flex-grid-wrap" id="i1lwz-2">
          <h1 className="pw-user-text-style-6ae56f11-b178-4dd1-8bf0-1f16cb6f2a2e" id="ispyh-2-2">
            让每个决策
            <br id="ibpex9" />
            都可验证。
          </h1>
          <div className="pw-block-style" id="i81y03-2">
            <p className="pw-user-text-style-3045d4e5-cceb-462e-a2d3-aff6a744df83" id="ispyh-2-3-4">
              Bunnies 量研 · A 股量化研究
            </p>
            <StatusTags />
          </div>
        </div>
        <div className="pwb-flex-grid-wrap" id="i1lwz-2-2">
          <p className="pw-user-text-style-3045d4e5-cceb-462e-a2d3-aff6a744df83" id="ispyh-2-3">
            行情、财报、资金流与公告进入同一条研究链：先校验数据，再让因子、模型与价值审查互相复核，最后经过风控闸门和人工审批。
          </p>
          <div className="pw-block-style" id="i81y03">
            <StockSearch />
          </div>
        </div>
      </div>
    </div>
  );
}
