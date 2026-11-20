// Section markup originally derived from the futureoffinance template; content is Bunnies.
/* eslint-disable @next/next/no-img-element */
import { LivePanel } from "../LivePanel";

export function Product() {
  return (
    <div className="pwb-flex-grid-wrap" id="ilwyn">
      <div className="pwb-flex-grid-wrap" id="i1lwz-2-4">
        <div className="pw-block-style" id="ipgqtg">
          <div className="pw-block-style" id="iklwi7">
            <div className="pw-block-style" id="iyg80u">
              <h4 className="pw-user-text-style-47248e95-3515-4423-8189-0bbe15d8728f" id="ispyh-2-3-2-3-2-2-2-3">
                模拟账户
              </h4>
              <h1 className="pw-user-text-style-9711fa5c-ea00-4752-8af0-945c28ef776e" id="ispyh-2-2-2">
                账户真实状态，
                <br />
                不挑好看的数字。
              </h1>
              <div className="pw-block-style" id="i81y03-3">
                <div className="pwb-flex-grid-wrap" id="i1lwz-2-2-2-6" data-link="ashare-quant.html" role="link" tabIndex={0}>
                  <p className="pw-user-text-style-db4943d4-453d-474d-b88a-07d9ad351c62" id="ispyh-2-3-2-7">
                    打开驾驶舱
                  </p>
                  <img className="pw-image-style" src="/sites/bunnies/images/arrow-r.svg" loading="lazy" id="i9hq34-3" alt="" />
                </div>
                <div className="pwb-flex-grid-wrap" id="i1lwz-2-2-2-5-2" data-link="#pricing-section" role="link" tabIndex={0}>
                  <p className="pw-user-text-style-db4943d4-453d-474d-b88a-07d9ad351c62" id="ispyh-2-3-2-6-2">
                    看策略状态
                  </p>
                </div>
              </div>
            </div>
            <div className="pw-block-style" id="iyg80u-2">
              <p className="pw-user-text-style-3045d4e5-cceb-462e-a2d3-aff6a744df83" id="ispyh-2-3-5">
                10 万元模拟账户的净值、相对沪深 300 的表现与风控闸门状态，直接读取研究服务；服务离线时显示最近一次快照。
              </p>
            </div>
          </div>
          <div className="pw-block-style" id="ijuu9f">
            <LivePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
