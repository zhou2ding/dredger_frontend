import { r as ref, n as nextTick, j as resolveComponent, e as createElementBlock, o as openBlock, F as createBaseVNode, G as toDisplayString, u as unref, H as dayjs, f as createVNode, g as withCtx, B as createApp, C as installer } from "./index-Di9skDmY.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _hoisted_1 = { class: "export-index" };
const _hoisted_2 = { class: "floor" };
const _hoisted_3 = { class: "value" };
const _hoisted_4 = { class: "floor" };
const _hoisted_5 = { class: "value" };
const _hoisted_6 = { class: "floor-1" };
const _hoisted_7 = { class: "info" };
const _hoisted_8 = { class: "floor-1" };
const _hoisted_9 = { class: "info" };
const _hoisted_10 = ["src"];
const _hoisted_11 = { class: "floor-1" };
const _hoisted_12 = { class: "info" };
const _hoisted_13 = ["src"];
const _sfc_main = {
  __name: "Index",
  setup(__props) {
    const exportInfo = ref({
      shiftName: "",
      startTime: "",
      endTime: "",
      pieImg: "",
      scatterImg: "",
      tableData: []
    });
    window.api.getReportMessage(async (message) => {
      exportInfo.value = message;
      await nextTick();
      window.api.readyDownload();
    });
    return (_ctx, _cache) => {
      const _component_el_table_column = resolveComponent("el-table-column");
      const _component_el_table = resolveComponent("el-table");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          _cache[0] || (_cache[0] = createBaseVNode("div", { class: "name" }, "船名", -1)),
          createBaseVNode("div", _hoisted_3, "：" + toDisplayString(exportInfo.value.shiftName), 1)
        ]),
        createBaseVNode("div", _hoisted_4, [
          _cache[1] || (_cache[1] = createBaseVNode("div", { class: "name" }, "施工时间", -1)),
          createBaseVNode("div", _hoisted_5, "：" + toDisplayString(unref(dayjs)(exportInfo.value.startTime).format("YYYY-MM-DD")) + "————" + toDisplayString(unref(dayjs)(exportInfo.value.endTime).format("YYYY-MM-DD")), 1)
        ]),
        createBaseVNode("div", _hoisted_6, [
          _cache[2] || (_cache[2] = createBaseVNode("div", { class: "title" }, "班组统计表格", -1)),
          createBaseVNode("div", _hoisted_7, [
            createVNode(_component_el_table, {
              data: exportInfo.value.tableData,
              border: true,
              stripe: "",
              style: { "width": "100%" },
              class: "table"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_table_column, {
                  label: "班组",
                  prop: "shiftName"
                }),
                createVNode(_component_el_table_column, {
                  sortable: "",
                  label: "施工时长(min)",
                  prop: "workDuration"
                }),
                createVNode(_component_el_table_column, {
                  sortable: "",
                  label: "班组总产量(m³)",
                  prop: "totalProduction"
                }),
                createVNode(_component_el_table_column, {
                  sortable: "",
                  label: "总能耗(kW·h)",
                  prop: "totalEnergy"
                })
              ]),
              _: 1
            }, 8, ["data"])
          ])
        ]),
        createBaseVNode("div", _hoisted_8, [
          _cache[3] || (_cache[3] = createBaseVNode("div", { class: "title" }, "班组统计信息", -1)),
          createBaseVNode("div", _hoisted_9, [
            createBaseVNode("img", {
              class: "img",
              src: exportInfo.value.pieImg,
              alt: ""
            }, null, 8, _hoisted_10)
          ])
        ]),
        createBaseVNode("div", _hoisted_11, [
          _cache[4] || (_cache[4] = createBaseVNode("div", { class: "title" }, "最优班组施工参数", -1)),
          createBaseVNode("div", _hoisted_12, [
            createBaseVNode("img", {
              class: "img",
              src: exportInfo.value.scatterImg,
              alt: ""
            }, null, 8, _hoisted_13)
          ])
        ])
      ]);
    };
  }
};
const printRender = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-309ae715"]]);
const app = createApp(printRender);
app.use(installer);
app.mount("#app");
