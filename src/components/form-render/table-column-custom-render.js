import { h } from 'vue'

export default {
  name: "table-column-custom-render",
  props: {
    row: Object,
    column: Object,
    dataTableRef: Object,  //指向data-table组件实例
    renderFn: Function
  },
  render() {
    const params = {
      row: this.row,
      column: this.column,
      dataTableRef: this.dataTableRef,  //指向data-table组件实例
    }
    const components = this.$root.$.appContext.components

    return this.renderFn(h, params, components)
  }
}
