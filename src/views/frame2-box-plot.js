import React, { useState } from 'react'

import { Helmet } from 'react-helmet'

import './frame2-box-plot.css'

const Frame2BoxPlot = (props) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className="frame2-box-plot-container1">
      <Helmet>
        <title>VAPORCONE-SSDA</title>
      </Helmet>
      <div className="frame2-box-plot-frame2-box-plot">
        <div className="frame2-box-plot-header">
          <div className="frame2-box-plot-frames10">
            <span className="frame2-box-plot-text10">
              ソースデータ
            </span>
            <img
              alt="image13215"
              src="/image13215-yqx-200w.png"
              className="frame2-box-plot-image1"
            />
          </div>
          <div className="frame2-box-plot-frames11">
            <img
              alt="Image329"
              src="/image329-qlmq-200h.png"
              className="frame2-box-plot-image"
            />
            <span style={{ marginLeft: '30px' }}>user1</span>
            <div className="frame2-box-plot-frames12">
              <img
                alt="Frame3211"
                src="/frame3211-w0iy.svg"
                className="frame2-box-plot-frame"
              />
              <span className="frame2-box-plot-text11">JP</span>
            </div>
            <span className="frame2-box-plot-text12">ログアウト</span>
          </div>
        </div>
        <div className="frame2-box-plot-body">
          {/* <div className="frame2-box-plot-overview-card">
            <span className="frame2-box-plot-text13">統計一覧</span>
            <div className="frame2-box-plot-overview">
              <div className="frame2-box-plot-frames13">
                <div className="frame2-box-plot-frames14">
                  <span className="frame2-box-plot-text14">
                    確認待ちデータ数
                  </span>
                </div>
                <div className="frame2-box-plot-frames15">
                  <span className="frame2-box-plot-text15">臨床総症例数</span>
                </div>
                <div className="frame2-box-plot-frames16">
                  <span className="frame2-box-plot-text16">
                    スタディ総症例数
                  </span>
                </div>
                <div className="frame2-box-plot-frames17">
                  <span className="frame2-box-plot-text17">
                    データ最終更新日
                  </span>
                </div>
                <div className="frame2-box-plot-frames18">
                  <span className="frame2-box-plot-text18">最終確認日</span>
                </div>
                <span className="frame2-box-plot-text19">ステータス</span>
              </div>
              <div className="frame2-box-plot-frames19">
                <div className="frame2-box-plot-frames20">
                  <span className="frame2-box-plot-text20">
                    <span className="frame2-box-plot-text21">5</span>
                    <span className="frame2-box-plot-text22">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: ' ',
                        }}
                      />
                    </span>
                    <span className="frame2-box-plot-text23">
                      (+2)
                      <span
                        dangerouslySetInnerHTML={{
                          __html: ' ',
                        }}
                      />
                    </span>
                  </span>
                </div>
                <div className="frame2-box-plot-frames21">
                  <span className="frame2-box-plot-text24">
                    <span className="frame2-box-plot-text25">1</span>
                    <span className="frame2-box-plot-text26"> </span>
                    <span className="frame2-box-plot-text27">
                      (+1)
                      <span
                        dangerouslySetInnerHTML={{
                          __html: ' ',
                        }}
                      />
                    </span>
                  </span>
                </div>
                <div className="frame2-box-plot-frames22">
                  <span className="frame2-box-plot-text28">
                    <span className="frame2-box-plot-text29">1</span>
                    <span className="frame2-box-plot-text30"> </span>
                    <span className="frame2-box-plot-text31">
                      (+1)
                      <span
                        dangerouslySetInnerHTML={{
                          __html: ' ',
                        }}
                      />
                    </span>
                  </span>
                </div>
                <div className="frame2-box-plot-frames23">
                  <span className="frame2-box-plot-text32">11/12/2025</span>
                </div>
                <div className="frame2-box-plot-frames24">
                  <span className="frame2-box-plot-text33">11/11/2025</span>
                </div>
                <span className="frame2-box-plot-text34">確認中</span>
              </div>
            </div>
          </div> */}
        </div>
        <div className={
          isFullscreen
            ? 'frame2-box-plot-table-card fullscreen'
            : 'frame2-box-plot-table-card'
        }>
          <div className="frame2-box-plot-card-title">
            <div className="frame2-box-plot-card-ops">
              {/* <img
                alt="label3248"
                src="/label3248-j3gb.svg"
                className="frame2-box-plot-label"
              />
              <img
                alt="selector3250"
                src="/selector3250-cc8.svg"
                className="frame2-box-plot-selector"
              /> */}
              <img
                alt="iconscaleup3938"
                src={isFullscreen ? '/icon-close.svg' : "/iconscaleup3938-fqo.svg"}
                className="frame2-box-plot-iconscaleup"
                onClick={toggleFullscreen}
              />
            </div>
            <span className="frame2-box-plot-text35">症例一覧</span>
          </div>
          <div className="frame2-box-plot-box-plot">
            <iframe
              src="/chart/index.html"
              className="frame2-box-plot-iframe"
              id="dataFrame"
            ></iframe>
          </div>
        </div>
      </div>
      {/* <a
        href="https://play.teleporthq.io/signup"
        className="frame2-box-plot-link"
      >
        <div
          aria-label="Sign up to TeleportHQ"
          className="frame2-box-plot-container2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 19 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="frame2-box-plot-icon1"
          >
            <path
              d="M9.1017 4.64355H2.17867C0.711684 4.64355 -0.477539 5.79975 -0.477539 7.22599V13.9567C-0.477539 15.3829 0.711684 16.5391 2.17867 16.5391H9.1017C10.5687 16.5391 11.7579 15.3829 11.7579 13.9567V7.22599C11.7579 5.79975 10.5687 4.64355 9.1017 4.64355Z"
              fill="#B23ADE"
            ></path>
            <path
              d="M10.9733 12.7878C14.4208 12.7878 17.2156 10.0706 17.2156 6.71886C17.2156 3.3671 14.4208 0.649963 10.9733 0.649963C7.52573 0.649963 4.73096 3.3671 4.73096 6.71886C4.73096 10.0706 7.52573 12.7878 10.9733 12.7878Z"
              fill="#FF5C5C"
            ></path>
            <path
              d="M17.7373 13.3654C19.1497 14.1588 19.1497 15.4634 17.7373 16.2493L10.0865 20.5387C8.67402 21.332 7.51855 20.6836 7.51855 19.0968V10.5141C7.51855 8.92916 8.67402 8.2807 10.0865 9.07221L17.7373 13.3654Z"
              fill="#2874DE"
            ></path>
          </svg>
          <span className="frame2-box-plot-text36">Built in TeleportHQ</span>
        </div>
      </a> */}
    </div>
  )
}

export default Frame2BoxPlot
