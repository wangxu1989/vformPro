<template>
  <div class="title">表单设计器</div>
  <el-scrollbar class="side-scroll-bar" :style="{height: scrollerHeight}">
    <div class="panel-container">

    <el-tabs :tab-position="tabPosition" v-model="firstTab" class="no-bottom-margin indent-left-margin" @tab-change="tabChange">
      <el-tab-pane name="outline">
        <template #label>
          <span
            ><svg-icon icon-class="node-tree" />
            {{ i18nt("designer.outline") }}</span
          >
        </template>
        <div style="margin-top:10px">
          <span>{{i18nt('designer.toolbar.nodeTreeTitle')}}</span>
          <div v-if="showNodeTreeDrawerFlag">
            <el-tree ref="nodeTree" :data="nodeTreeData" node-key="id" default-expand-all highlight-current class="node-tree"
              icon-class="el-icon-arrow-right" @node-click="onNodeTreeClick"></el-tree>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane name="field">
        <template #label>
          <span
            ><svg-icon icon-class="el-set-up" />
            {{ i18nt("designer.field") }}</span
          >
        </template>
        <div>
          <div style="margin: 10px 0">
            <el-autocomplete
              style="width:95%"
              v-model="state"
              :fetch-suggestions="querySearchAsync"
              placeholder="请输入关键词"
              @select="handleSelect"
            ></el-autocomplete>
          </div>
          字段组
        </div>
      </el-tab-pane>
      <el-tab-pane name="componentLib">
        <template #label>
          <span><svg-icon icon-class="el-set-up" /> {{i18nt('designer.componentLib')}}</span>
        </template>
        <div style="margin-top: 10px">
          <el-autocomplete
            style="width:95%"
            v-model="state"
            :fetch-suggestions="componentLibSearch"
            placeholder="请输入关键词"
            @select="componentLibSelect"
          ></el-autocomplete>
          </div>

      <el-collapse v-model="activeNames" class="widget-collapse">
        <el-collapse-item name="1" :title="i18nt('designer.containerTitle')" v-if="containers.length">
          <draggable tag="ul" :list="containers" item-key="key" :group="{name: 'dragGroup', pull: 'clone', put: false}"
                     :clone="handleContainerWidgetClone" ghost-class="ghost" :sort="false"
                     :move="checkContainerMove" @end="onContainerDragEnd">
            <template #item="{ element: ctn }">
              <li class="container-widget-item" :title="ctn.displayName" @dblclick="addContainerByDbClick(ctn)">
                <span><svg-icon :icon-class="ctn.icon" class-name="color-svg-icon" />{{getWidgetLabel(ctn)}}</span>
              </li>
            </template>
          </draggable>
        </el-collapse-item>

        <el-collapse-item name="2" :title="i18nt('designer.basicFieldTitle')" v-if="basicFields.length">
          <draggable tag="ul" :list="basicFields" item-key="key" :group="{name: 'dragGroup', pull: 'clone', put: false}"
                     :move="checkFieldMove"
                     :clone="handleFieldWidgetClone" ghost-class="ghost" :sort="false">
            <template #item="{ element: fld }">
              <li class="field-widget-item" :title="fld.displayName" @dblclick="addFieldByDbClick(fld)">
                <span><svg-icon :icon-class="fld.icon" class-name="color-svg-icon" />{{getWidgetLabel(fld)}}</span>
              </li>
            </template>
          </draggable>
        </el-collapse-item>

        <el-collapse-item name="3" :title="i18nt('designer.advancedFieldTitle')" v-if="advancedFields.length">
          <draggable tag="ul" :list="advancedFields" item-key="key" :group="{name: 'dragGroup', pull: 'clone', put: false}"
                     :move="checkFieldMove"
                     :clone="handleFieldWidgetClone" ghost-class="ghost" :sort="false">
            <template #item="{ element: fld }">
              <li class="field-widget-item" :title="fld.displayName" @dblclick="addFieldByDbClick(fld)">
                <span><svg-icon :icon-class="fld.icon" class-name="color-svg-icon" />{{getWidgetLabel(fld)}}</span>
              </li>
            </template>
          </draggable>
        </el-collapse-item>

        <el-collapse-item name="4" :title="i18nt('designer.customFieldTitle')" v-if="customFields.length">
          <draggable tag="ul" :list="customFields" item-key="key" :group="{name: 'dragGroup', pull: 'clone', put: false}"
                     :move="checkFieldMove"
                     :clone="handleFieldWidgetClone" ghost-class="ghost" :sort="false">
            <template #item="{ element: fld }">
              <li class="field-widget-item" :title="fld.displayName" @dblclick="addFieldByDbClick(fld)">
                <span>
                  <svg-icon :icon-class="fld.icon" class-name="color-svg-icon" />{{getWidgetLabel(fld)}}</span>
              </li>
            </template>
          </draggable>
        </el-collapse-item>

      </el-collapse>

      </el-tab-pane>

      <el-tab-pane v-if="showFormTemplates()" name="formLib" style="padding: 8px">
        <template #label>
          <span><svg-icon icon-class="el-form-template" /> {{i18nt('designer.formLib')}}</span>
        </template>

        <template v-for="(ft, idx) in formTemplates">
          <el-card :bord-style="{ padding: '0' }" shadow="hover" class="ft-card">
            <el-popover placement="right" trigger="hover">
              <template #reference>
                <img :src="ftImages[idx].imgUrl" style="width: 200px">
              </template>
              <img :src="ftImages[idx].imgUrl" style="height: 600px;width: 720px">
            </el-popover>
            <div class="bottom clear-fix">
              <span class="ft-title">#{{idx+1}} {{ft.title}}</span>
              <el-button type="text" class="right-button" @click="loadFormTemplate(ft.jsonUrl)">
                {{i18nt('designer.hint.loadFormTemplate')}}</el-button>
            </div>
          </el-card>
        </template>
      </el-tab-pane>

    </el-tabs>

    </div>
  </el-scrollbar>
</template>

<script>
  import SvgIcon from '@/components/svg-icon'
  import {containers as CONS, basicFields as BFS, advancedFields as AFS, customFields as CFS} from "./widgetsConfig"
  import {formTemplates} from './templatesConfig'
  import {addWindowResizeHandler, generateId,traverseAllWidgets} from "@/utils/util"
  import i18n from "@/utils/i18n"
  import axios from 'axios'

  import ftImg1 from '@/assets/ft-images/t1.png'
  import ftImg2 from '@/assets/ft-images/t2.png'
  import ftImg3 from '@/assets/ft-images/t3.png'
  import ftImg4 from '@/assets/ft-images/t4.png'
  import ftImg5 from '@/assets/ft-images/t5.png'
  import ftImg6 from '@/assets/ft-images/t6.png'
  import ftImg7 from '@/assets/ft-images/t7.png'
  import ftImg8 from '@/assets/ft-images/t8.png'

  export default {
    name: "FieldPanel",
    mixins: [i18n],
    components: {
      SvgIcon
    },
    props: {
      designer: Object,
    },
    inject: ['getBannedWidgets', 'getDesignerConfig'],
    data() {
      return {
        showNodeTreeDrawerFlag: false,
        nodeTreeData: [],
        search: "",
        state: "",
        restaurants: [],
        designerConfig: this.getDesignerConfig(),

        firstTab: 'componentLib',
        tabPosition: 'left',

        scrollerHeight: 0,

        activeNames: ['1', '2', '3', '4'],

        containers: [],
        basicFields: [],
        advancedFields: [],
        customFields: [],

        copycontainers: [],
        copybasicFields: [],
        copyadvancedFields: [],
        copycustomFields: [],

        formTemplates: formTemplates,
        ftImages: [
          {imgUrl: ftImg1},
          {imgUrl: ftImg2},
          {imgUrl: ftImg3},
          {imgUrl: ftImg4},
          {imgUrl: ftImg5},
          {imgUrl: ftImg6},
          {imgUrl: ftImg7},
          {imgUrl: ftImg8},
        ]
      }
    },
    computed: {
      //
    },
    created() {
      this.loadWidgets()
    },
    mounted() {
      //this.loadWidgets()

      this.scrollerHeight = window.innerHeight - 56 + 'px'
      addWindowResizeHandler(() => {
        this.$nextTick(() => {
          this.scrollerHeight = window.innerHeight - 56 + 'px'
          //console.log(this.scrollerHeight)
        })
      })
    },
    methods: {
      getWidgetLabel(widget) {
        if (!!widget.alias) {  //优先显示组件别名
          return this.i18n2t(`designer.widgetLabel.${widget.alias}`, `extension.widgetLabel.${widget.alias}`)
        }

        return this.i18n2t(`designer.widgetLabel.${widget.type}`, `extension.widgetLabel.${widget.type}`)
      },

      isBanned(wName) {
        return this.getBannedWidgets().indexOf(wName) > -1
      },

      showFormTemplates() {
        if (this.designerConfig['formTemplates'] === undefined) {
          return true
        }

        return !!this.designerConfig['formTemplates']
      },

      loadWidgets() {
        this.containers = CONS.map(con => {
          return {
            key: generateId(),
            ...con,
            displayName: this.i18n2t(`designer.widgetLabel.${con.type}`, `extension.widgetLabel.${con.type}`),
            value: this.i18n2t(`designer.widgetLabel.${con.type}`, `extension.widgetLabel.${con.type}`)
          }
        }).filter(con => {
          return !con.internal && !this.isBanned(con.type)
        })
        this.copycontainers = this.containers

        this.basicFields = BFS.map(fld => {
          return {
            key: generateId(),
            ...fld,
            displayName: this.i18n2t(`designer.widgetLabel.${fld.type}`, `extension.widgetLabel.${fld.type}`),
            value: this.i18n2t(`designer.widgetLabel.${fld.type}`, `extension.widgetLabel.${fld.type}`)
          }
        }).filter(fld => {
          return !this.isBanned(fld.type)
        })
        this.copybasicFields = this.basicFields

        this.advancedFields = AFS.map(fld => {
          return {
            key: generateId(),
            ...fld,
            displayName: this.i18n2t(`designer.widgetLabel.${fld.type}`, `extension.widgetLabel.${fld.type}`),
            value: this.i18n2t(`designer.widgetLabel.${fld.type}`, `extension.widgetLabel.${fld.type}`)
          }
        }).filter(fld => {
          return !this.isBanned(fld.type)
        })
        this.copyadvancedFields = this.advancedFields

        this.customFields = CFS.map(fld => {
          return {
            key: generateId(),
            ...fld,
            displayName: this.i18n2t(`designer.widgetLabel.${fld.type}`, `extension.widgetLabel.${fld.type}`),
            value: this.i18n2t(`designer.widgetLabel.${fld.type}`, `extension.widgetLabel.${fld.type}`)
          }
        }).filter(fld => {
          return !this.isBanned(fld.type)
        })
        this.copycustomFields= this.customFields
      },

      handleContainerWidgetClone(origin) {
        return this.designer.copyNewContainerWidget(origin)
      },

      handleFieldWidgetClone(origin) {
        return this.designer.copyNewFieldWidget(origin)
      },

      /* draggable组件的move钩子是在内部子组件被拖放到其他draggable组件时触发！！ */
      checkContainerMove(evt) {
        return this.designer.checkWidgetMove(evt)
      },

      /* draggable组件的move钩子是在内部子组件被拖放到其他draggable组件时触发！！ */
      checkFieldMove(evt) {
        return this.designer.checkFieldMove(evt)
      },

      onContainerDragEnd(evt) {
        //console.log('Drag end of container: ')
        //console.log(evt)
      },

      addContainerByDbClick(container) {
        this.designer.addContainerByDbClick(container)
      },

      addFieldByDbClick(widget) {
        this.designer.addFieldByDbClick(widget)
      },

      loadFormTemplate(jsonUrl) {
        this.$confirm(this.i18nt('designer.hint.loadFormTemplateHint'), this.i18nt('render.hint.prompt'), {
          confirmButtonText: this.i18nt('render.hint.confirm'),
          cancelButtonText: this.i18nt('render.hint.cancel')
        }).then(() => {
          axios.get(jsonUrl).then(res => {
            let modifiedFlag = false
            if (typeof res.data === 'string') {
              modifiedFlag = this.designer.loadFormJson( JSON.parse(res.data) )
            } else if (res.data.constructor === Object) {
              modifiedFlag = this.designer.loadFormJson(res.data)
            }
            if (modifiedFlag) {
              this.designer.emitHistoryChange()
            }

            this.$message.success(this.i18nt('designer.hint.loadFormTemplateSuccess'))
          }).catch(error => {
            this.$message.error(this.i18nt('designer.hint.loadFormTemplateFailed') + ':' + error)
          })
        }).catch(error => {
          console.error(error)
        })
      },
      // 组件查询
      componentLibSearch(queryString, cb) {
        var restaurants = [...this.copycontainers,...this.copybasicFields,...this.copyadvancedFields,...this.copycustomFields];
        var results = queryString
          ? restaurants.filter(this.componentLibFilter(queryString))
          : restaurants;
        cb(results);
        console.log(results);
        if (results.length === 0) {
          this.containers = results;
          this.basicFields = results;
          this.advancedFields = results;
          this.customFields = results;
        } else {
          this.containers = this.copycontainers;
          this.basicFields = this.copybasicFields;
          this.advancedFields = this.copyadvancedFields;
          this.customFields = this.copycustomFields;
        }
      },
      componentLibFilter(queryString) {
        return (state) => {
          return (
            state.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
          );
        };
      },
      componentLibSelect(item) {
        console.log(item)
        this.containers = [];
        this.basicFields = [];
        this.advancedFields = [];
        this.customFields = [];
        this.copycontainers.forEach(ele => {
          if (ele.type === item.type) {
            this.containers.push(item)
          }
        })
        this.copybasicFields.forEach(ele => {
          if (ele.type === item.type) {
            this.basicFields.push(item)
          }
        })
        this.copyadvancedFields.forEach(ele => {
          if (ele.type === item.type) {
            this.advancedFields.push(item)
          }
        })
        this.copycustomFields.forEach(ele => {
          if (ele.type === item.type) {
            this.customFields.push(item)
          }
        })
      },
      // 左侧tab切换
      tabChange(name) {
        if (name === 'outline') {
          this.showNodeTreeDrawer()
        }
      },
      showNodeTreeDrawer() {
        console.log(11)
        this.refreshNodeTree()
        this.showNodeTreeDrawerFlag = true
        this.$nextTick(() => {
          if (!!this.designer.selectedId) {  //同步当前选中组件到节点树！！！
            this.$refs.nodeTree.setCurrentKey(this.designer.selectedId)
          }
        })
      },
      refreshNodeTree() {
        this.nodeTreeData.length = 0
        this.designer.widgetList.forEach(wItem => {
          this.buildTreeNodeOfWidget(wItem, this.nodeTreeData)
        })
      },
      buildTreeNodeOfWidget(widget, treeNode) {
        let curNode = {
          id: widget.id,
          label: widget.options.label || widget.type,
          //selectable: true,
        }
        treeNode.push(curNode)

        if (widget.category === undefined) {
          return
        }

        curNode.children = []
        if (widget.type === 'grid') {
          widget.cols.map(col => {
            let colNode = {
              id: col.id,
              label: col.options.name || widget.type,
              children: []
            }
            curNode.children.push(colNode)
            col.widgetList.map(wChild => {
              this.buildTreeNodeOfWidget(wChild, colNode.children)
            })
          })
        } else if (widget.type === 'table') {
          //TODO: 需要考虑合并单元格！！
          widget.rows.map(row => {
            let rowNode = {
              id: row.id,
              label: 'table-row',
              selectable: false,
              children: [],
            }
            curNode.children.push(rowNode)

            row.cols.map(cell => {
              if (!!cell.merged) {  //跳过合并单元格！！
                return
              }

              let rowChildren = rowNode.children
              let cellNode = {
                id: cell.id,
                label: 'table-cell',
                children: []
              }
              rowChildren.push(cellNode)

              cell.widgetList.map(wChild => {
                this.buildTreeNodeOfWidget(wChild, cellNode.children)
              })
            })
          })
        } else if (widget.type === 'tab') {
          widget.tabs.map(tab => {
            let tabNode = {
              id: tab.id,
              label: tab.options.name || widget.type,
              selectable: false,
              children: []
            }
            curNode.children.push(tabNode)
            tab.widgetList.map(wChild => {
              this.buildTreeNodeOfWidget(wChild, tabNode.children)
            })
          })
        } else if (widget.type === 'sub-form') {
          widget.widgetList.map(wChild => {
            this.buildTreeNodeOfWidget(wChild, curNode.children)
          })
        } else if (widget.category === 'container') {  //自定义容器
          widget.widgetList.map(wChild => {
            this.buildTreeNodeOfWidget(wChild, curNode.children)
          })
        }
      },
      onNodeTreeClick(nodeData, node, nodeEl) {
        //console.log('test', JSON.stringify(nodeData))

        if ((nodeData.selectable !== undefined) && !nodeData.selectable) {
          this.$message.info(this.i18nt('designer.hint.currentNodeCannotBeSelected'))
        } else {
          const selectedId = nodeData.id
          const foundW = this.findWidgetById(selectedId)
          if (!!foundW) {
            this.designer.setSelected(foundW)
          }
        }
      },
      findWidgetById(wId) {
        let foundW = null
        traverseAllWidgets(this.designer.widgetList, (w) => {
          if (w.id === wId) {
            foundW = w
          }
        })

        return foundW
      },
    }

  }
</script>

<style lang="scss" scoped>
  .color-svg-icon {
    color: $--color-primary;
  }

  .side-scroll-bar {
    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
    }
  }

  div.panel-container {
    padding-bottom: 10px;
  }

  .no-bottom-margin :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  .indent-left-margin {
    :deep(.el-tabs__nav) {
      margin-left: 20px;
    }
  }

  .el-collapse-item :deep(ul) > li {
    list-style: none;
  }

  .widget-collapse {
    border-top-width: 0;

    :deep(.el-collapse-item__header) {
      margin-left: 8px;
      font-style: italic;
      font-weight: bold;
    }

    :deep(.el-collapse-item__content) {
      padding-bottom: 6px;

      ul {
        padding-left: 10px;  /* 重置IE11默认样式 */
        margin: 0;  /* 重置IE11默认样式 */
        margin-block-start: 0;
        margin-block-end: 0.25em;
        padding-inline-start: 10px;

        &:after {
          content: "";
          display: block;
          clear: both;
        }

        .container-widget-item, .field-widget-item {
          //text-align: center; // 居中显示不太美观
          display: inline-block;
          height: 28px;
          line-height: 28px;
          width: 115px;
          float: left;
          margin: 2px 6px 6px 0;
          cursor: move;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          background: #f1f2f3;
        }

        .container-widget-item:hover, .field-widget-item:hover {
          background: #EBEEF5;
          outline: 1px solid $--color-primary;
        }

        .drag-handler {
          position: absolute;
          top: 0;
          left: 160px;
          background-color: #dddddd;
          border-radius: 5px;
          padding-right: 5px;
          font-size: 11px;
          color: #666666;
        }
      }
    }
  }

  .el-card.ft-card {
    border: 1px solid #8896B3;
  }

  .ft-card {
    margin-bottom: 10px;

    .bottom {
      margin-top: 10px;
      line-height: 12px;
    }

    /*
    .image-zoom {
      height: 500px;
      width: 620px
    }
    */

    .ft-title {
      font-size: 13px;
      font-weight: bold;
    }

    .right-button {
      padding: 0;
      float: right;
    }

    .clear-fix:before, .clear-fix:after {
      display: table;
      content: "";
    }

    .clear-fix:after {
      clear: both;
    }

  }
.title{
  height: 41px;
  line-height: 41px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px dotted #CCCCCC
}
:deep(.indent-left-margin .el-tabs__nav){
  margin-left: 0;
}
:deep(.el-tabs__item){
  padding-left: 0;
}
:deep(.node-tree) {
  .el-tree > .el-tree-node:after {
    border-top: none;
  }
  .el-tree-node {
    position: relative;
    padding-left: 12px;
  }

  .el-tree-node__content {
    padding-left: 0 !important;
  }

  .el-tree-node__expand-icon.is-leaf{
    display: none;
  }

  .el-tree-node__children {
    padding-left: 12px;
    overflow: visible !important; /* 加入此行让el-tree宽度自动撑开，超出宽度el-draw自动出现水平滚动条！ */
  }

  .el-tree-node :last-child:before {
    height: 38px;
  }

  .el-tree > .el-tree-node:before {
    border-left: none;
  }

  .el-tree > .el-tree-node:after {
    border-top: none;
  }

  .el-tree-node:before {
    content: "";
    left: -4px;
    position: absolute;
    right: auto;
    border-width: 1px;
  }

  .el-tree-node:after {
    content: "";
    left: -4px;
    position: absolute;
    right: auto;
    border-width: 1px;
  }

  .el-tree-node:before {
    border-left: 1px dashed #4386c6;
    bottom: 0px;
    height: 100%;
    top: -10px;
    width: 1px;
  }

  .el-tree-node:after {
    border-top: 1px dashed #4386c6;
    height: 20px;
    top: 12px;
    width: 16px;
  }

  .el-tree-node.is-current > .el-tree-node__content {
    background: #c2d6ea !important;
  }

  .el-tree-node__expand-icon {
    margin-left: -3px;
    padding: 6px 6px 6px 0px;
    font-size: 16px;
  }

}
</style>
