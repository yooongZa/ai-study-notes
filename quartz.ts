import { Graph } from "@quartz-community/graph"
import ConditionalRender from "./quartz/components/ConditionalRender"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

export default await loadQuartzConfig()

const standard = await loadQuartzLayout()
const homeGraph = ConditionalRender({
  condition: ({ fileData }) => fileData.slug === "index",
  component: Graph({
    localGraph: {
      depth: -1,
      showTags: false,
      focusOnHover: true,
      enableRadial: true,
      linkDistance: 38,
      fontSize: 0.9,
      opacityScale: 2,
    },
  }),
})

export const layout = await loadQuartzLayout({
  byPageType: {
    content: {
      beforeBody: [...(standard.defaults.beforeBody ?? []), homeGraph],
    },
  },
})
