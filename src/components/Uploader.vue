<template>
  <div class="uploader-container">
    <transition name="el-fade-in">
      <div class="uploader-drop" id="uploader-drop" v-show="showDrop">
        <div class="uploader-drop-header" v-if="showDropheader">
          <div class="header-back">
            <a href="javascript:void(0)" @click="showDrop = false">
              <i class="el-icon-back"></i> Back
            </a>
          </div>
          <div class="header-title">Add more files</div>
          <div class="header-title"></div>
        </div>
        <i class="el-icon-upload"></i>
        <div class="uploader-drop-item">Drop files here</div>
        <div class="uploader-drop-item">
          <input type="file" id="filePicker" />
          <input type="file" id="dirPicker" />
          <a href="javascript:void(0)" @click="chooseFiles"> browse file</a>
          <span> or</span>
          <a href="javascript:void(0)" @click="chooseDir"> browse directory</a>
        </div>
      </div>
    </transition>

    <transition name="el-fade-in">
      <div class="uploader-list" v-show="!showDrop">
        <div class="uploader-list-toolbar">
          <a href="javascript:void(0)" @click="confirmCancel()">
            <i class="el-icon-delete"></i> Clear
          </a>
          <span> {{ taskList.length || "No" }} tasks </span>
          <a
            href="javascript:void(0)"
            @click="
              showDrop = true;
              showDropheader = true;
            "
          >
            <i class="el-icon-folder-add"></i> Add more
          </a>
        </div>
        <div class="uploader-list-main">
          <div class="list-row" v-for="item in taskList" :key="item.id">
            <el-row :gutter="10">
              <el-col :span="10">
                <div class="item-name">
                  <i class="el-icon-document" v-if="item.type === 'file'"></i>
                  <i class=" el-icon-folder" v-else></i>
                  <span :title="item.name">{{ item.name }}</span>
                </div>
              </el-col>
              <el-col :span="3">
                <span>{{ formatSize(item.fileSize || item.filSize) }}</span>
              </el-col>
              <el-col :span="8">
                <el-progress
                  :percentage="item.progress"
                  :status="item.status === 'error' ? 'exception' : ''"
                ></el-progress>
              </el-col>
              <el-col :span="3">
                <div class="table-operate">
                  <i
                    v-if="item.status === 'pause'"
                    class="el-icon-video-play"
                    @click="execTask(item)"
                  ></i>
                  <i
                    v-if="
                      item.status === 'uploading' || item.status === 'waiting'
                    "
                    class="el-icon-video-pause"
                    @click="pauseTask(item)"
                  ></i>

                  <i
                    v-if="item.status === 'complete'"
                    class="el-icon-check"
                  ></i>
                  <i
                    v-if="item.status === 'error'"
                    class="el-icon-refresh-left"
                    @click="retryTask(item)"
                  ></i>

                  <i
                    class="el-icon-circle-close"
                    @click="confirmCancel(item)"
                  ></i>

                  <i
                    class="el-icon-loading"
                    v-if="!item.extraInfo.presisted"
                  ></i>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
        <div class="uploader-list-footer">
          <el-button v-if="!isUploading" type="primary" @click="execTask()">
            Upload
          </el-button>
          <el-button v-else type="primary" @click="pauseTask()">
            Pause
          </el-button>
          <el-button v-if="false" type="danger" @click="confirmCancel">
            <i class="el-icon-delete-solid"></i> Clear
          </el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import {
  Uploader,
  UploaderOptions,
  EventType,
  UploadTask,
  FileChunk,
  UploadFile,
  ID,
  Obj,
  Storage
} from "../../../rx-uploader/src";

import {
  defineComponent,
  onMounted,
  onUnmounted,
  reactive,
  SetupContext,
  toRefs,
  watchEffect
} from "vue";
import { ElMessageBox } from "element-plus";

interface State {
  taskList: UploadTask[];
  showDrop: boolean;
  showDropheader: boolean;
  isUploading: boolean;
}

interface TaskExtraInfo extends Obj {
  presisted: boolean;
}

export default defineComponent({
  name: "Uploader",
  emits: [...Object.values(EventType)],
  setup(props, ctx: SetupContext) {
    const state = reactive<State>({
      taskList: reactive([]),
      showDrop: true,
      showDropheader: false,
      isUploading: false
    });
    console.log("🚀 ~ file: Uploader.vue ~ line 136 ~ setup ~ state", state);

    const options: UploaderOptions = {
      requestOptions: {
        url: "http://ecm.test.work.zving.com/catalogs/4751/files/upload",
        // headers: {
        //   CMPID: "f05dd7da36ba4e238f9c1f053c2e76e3",
        //   TOKEN:
        //     "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlY20gY2xpZW50IiwiaXNzIjoienZpbmciLCJjbGFpbURlZmF1bHRLZXkiOiJsaXVsZWkwMSIsImV4cCI6MTYwOTY2NzM0OCwiaWF0IjoxNjA5MDYyNTQ4LCJqdGkiOiI4MGQ1ZTVkMWQxODM0ZmQyYWVjOWI2NzAxZWUwYzVmYiJ9.y7tiMYmlJNpx3gtMsrD8qRxpZWpxhi7ZMBPyBeHr6Xk"
        // },
        headers() {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                CMPID: "f05dd7da36ba4e238f9c1f053c2e76e3",
                TOKEN:
                  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlY20gY2xpZW50IiwiaXNzIjoienZpbmciLCJjbGFpbURlZmF1bHRLZXkiOiJsaXVsZWkwMSIsImV4cCI6MTYwOTY2NzM0OCwiaWF0IjoxNjA5MDYyNTQ4LCJqdGkiOiI4MGQ1ZTVkMWQxODM0ZmQyYWVjOWI2NzAxZWUwYzVmYiJ9.y7tiMYmlJNpx3gtMsrD8qRxpZWpxhi7ZMBPyBeHr6Xk"
              });
            }, 200);
          });
        },
        body: (
          task: UploadTask,
          uploadfile: UploadFile,
          chunk: FileChunk,
          baseParams: Obj
        ) => {
          return Object.assign(baseParams, {
            chunkNumber: baseParams.chunkIndex + 1,
            identifier: uploadfile.id,
            filename: uploadfile.name,
            totalChunks: uploadfile.chunkIDList?.length
          });
        }
      },
      computeFileHash: true,
      computeChunkHash: true,
      taskConcurrency: 5,
      chunkConcurrency: 2,
      resumable: false,
      singleFileTask: false,
      maxRetryTimes: 3,
      retryInterval: 3000,
      skipTaskWhenUploadError: true
    };

    const uploader: Uploader = Uploader.create(options);

    // TODO
    Object.assign(window, { uploader });

    const checkUploading = (): boolean => {
      state.isUploading = uploader.isUploading();
      return state.isUploading;
    };

    const findTask = (id: ID): Nullable<UploadTask> => {
      return state.taskList.find(item => item.id === id) || null;
    };

    const findTaskIndex = (id: ID): number => {
      return state.taskList.findIndex(item => item.id === id);
    };

    const mergeTaskAttr = (task: UploadTask) => {
      if (task) {
        const current: Nullable<UploadTask> = findTask(task.id);
        current && Object.assign(current, task);
      }
    };

    const addOrUpdateTask = (inputTask: UploadTask): UploadTask => {
      const task = findTask(inputTask.id);
      task ? Object.assign(task, inputTask) : state.taskList.push(inputTask);
      return task || inputTask;
    };

    const eventHandler = (eventType: EventType, ...args: unknown[]) => {
      let task: Nullable<UploadTask>;
      let index: number;
      switch (eventType) {
        case EventType.TaskCreated:
          task = addOrUpdateTask(Object.assign({}, args[0]) as UploadTask);
          task.extraInfo.presisted = !options.resumable;
          break;
        case EventType.TaskRestore:
          task = addOrUpdateTask(Object.assign({}, args[0]) as UploadTask);
          task.extraInfo.presisted = true;
          break;
        case EventType.TaskPresist:
          task = findTask((args[0] as UploadTask).id);
          if (task) {
            task.extraInfo.presisted = true;
          }
          console.log("EventType.TaskPresist", task);
          break;
        case EventType.TaskCancel:
          task = args[0] as UploadTask;
          index = findTaskIndex(task.id);
          index !== -1 && state.taskList.splice(index, 1);
          break;
        case EventType.TaskProgress:
          mergeTaskAttr(args[0] as UploadTask);
          break;
        case EventType.TaskPause:
          mergeTaskAttr(args[0] as UploadTask);
          break;
        case EventType.TaskUpdate:
          mergeTaskAttr(args[0] as UploadTask);
          break;
        case EventType.TaskWaiting:
          mergeTaskAttr(args[0] as UploadTask);
          break;
        case EventType.TaskComplete:
          mergeTaskAttr(args[0] as UploadTask);
          break;
        case EventType.TaskError:
          mergeTaskAttr(args[0] as UploadTask);
          break;
      }
      ctx.emit(String(eventType), ...args);
      checkUploading();
    };

    Object.values(EventType).forEach(e =>
      uploader.on(e, (...args) => eventHandler(e, ...args))
    );

    let filePicker: Nullable<HTMLInputElement> = null;
    let dirPicker: Nullable<HTMLInputElement> = null;

    const chooseFiles = () => filePicker?.click();
    const chooseDir = () => dirPicker?.click();
    const initFilePickersAndDraggers = () => {
      const dropEl = document.querySelector("#uploader-drop") || document.body;
      uploader.options.fileDragger = {
        $el: dropEl as HTMLElement,
        onDragenter: () => {
          dropEl.classList.add("uploader-drop-hover");
        },
        onDragleave: (e: DragEvent) => {
          let relatedTarget: Nullable<HTMLElement> = e.relatedTarget
            ? (e.relatedTarget as HTMLElement)
            : null;
          let removeClass = () =>
            dropEl.classList.remove("uploader-drop-hover");
          if (relatedTarget && relatedTarget.id !== dropEl.id) {
            let parent: Nullable<HTMLElement> = relatedTarget?.parentElement;
            while (parent && parent.id !== dropEl.id) {
              parent = parent?.parentElement || null;
            }
            parent?.id !== dropEl.id && removeClass();
          } else {
            !relatedTarget && removeClass();
          }
        },
        onDrop: () => {
          dropEl.classList.remove("uploader-drop-hover");
          state.showDrop = false;
        }
      };
      const hideDrop = () => {
        state.showDrop = false;
      };
      filePicker = document.querySelector("#filePicker") as HTMLInputElement;
      dirPicker = document.querySelector("#dirPicker") as HTMLInputElement;
      filePicker.addEventListener("change", hideDrop);
      dirPicker.addEventListener("change", hideDrop);
      uploader.options.filePicker = [
        { $el: filePicker, multiple: true, directory: false },
        { $el: dirPicker, multiple: true, directory: true }
      ];
      uploader.initFilePickersAndDraggers();
    };

    const confirmCancel = (task?: UploadTask) => {
      ElMessageBox.confirm("Do you confirm to cancel all tasks ?", "Warning", {
        type: "warning"
      })
        .then(() => uploader.cancel(task))
        .catch(() => {
          console.log("cancel");
        });
    };

    const getRawTask = (id?: ID) => uploader.taskQueue.find(i => i.id === id);

    const execTask = (task?: UploadTask) => {
      uploader.upload(getRawTask(task?.id));
      checkUploading();
    };

    const pauseTask = (task?: UploadTask) => {
      uploader.pause(getRawTask(task?.id));
      checkUploading();
    };

    const cancelTask = (task?: UploadTask) => {
      uploader.cancel(getRawTask(task?.id));
      checkUploading();
    };

    const retryTask = (task?: UploadTask) => {
      uploader.retry(getRawTask(task?.id));
      checkUploading();
    };

    const formatSize = (size: number): string => {
      if (isNaN(size) || size === Infinity) {
        return "";
      }
      if (size < 1024) {
        return size.toFixed(0) + " B";
      }
      if (size < 1024 ** 2) {
        return (size / 1024.0).toFixed(0) + " KB";
      }
      if (size < 1024 ** 3) {
        return (size / 1024.0 / 1024.0).toFixed(1) + " M";
      }
      return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + " G";
    };

    const doSomeEffectBeforeCreated = () => {
      if (options.resumable) {
        Storage.UploadTask.length().then((len: number) => {
          state.showDrop = !len;
        });
      }
    };
    doSomeEffectBeforeCreated();

    watchEffect(() => {
      state.showDrop = !state.taskList.length;
    });

    onMounted(() => {
      initFilePickersAndDraggers();
    });

    onUnmounted(() => {
      Object.values(EventType).forEach(e => uploader.off(e));
      uploader.destory();
    });

    return {
      chooseFiles,
      chooseDir,
      confirmCancel,
      execTask,
      pauseTask,
      cancelTask,
      retryTask,
      formatSize,
      ...toRefs(state)
    };
  }
});
</script>
<style scoped>
.uploader-container {
  width: 750px;
  height: 550px;
  background-color: #fafafa;
  border-radius: 5px;
  box-sizing: border-box;
  text-align: center;
  position: relative;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}
.uploader-container .uploader-drop-hover {
  border: 2.5px dashed #409eff !important;
}
.uploader-container .uploader-drop .uploader-drop-header {
  display: flex;
  position: absolute;
  width: 100%;
  top: 0;
  border-bottom: 1px solid #eaeaea;
  height: 50px;
  line-height: 50px;
}
.header-back {
  text-align: left;
  padding-left: 15px;
}
.header-back,
.header-title {
  width: 33%;
}
.uploader-container .uploader-drop .el-icon-upload {
  display: block;
  font-size: 110px;
  color: #c0c4cc;
  margin: 28px 0;
  line-height: 50px;
}
.uploader-container .uploader-drop {
  border: 2px dashed #d9d9d9;
  /* cursor: pointer; */
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: absolute;
}

.uploader-container .uploader-drop,
.uploader-container .uploader-list {
  width: 100%;
  height: 100%;
  border-radius: 5px;
}
.uploader-container a {
  text-decoration: none;
  color: #2275d7;
}
.uploader-container .uploader-drop-item {
  margin: 10px;
}

.uploader-container .uploader-list {
  align-self: flex-start;
  border: 1px solid #d9d9d9;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
}
.uploader-container .uploader-list .uploader-list-toolbar,
.uploader-container .uploader-list .uploader-list-footer {
  padding: 0 15px;
  height: 50px;
  justify-content: space-between;
  position: relative;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.uploader-container .uploader-list .uploader-list-footer {
  border-top: 1px solid #eaeaea;
  height: 65px;
  justify-content: flex-end;
}

.uploader-container .uploader-list .uploader-list-main {
  width: 100%;
  height: calc(100% - 65px - 50px);
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 10px 0;
  /* border: 1px solid; */
}
.uploader-container .uploader-list .uploader-list-main .task-ul {
  text-decoration: none;
}
.uploader-container .uploader-list .uploader-list-main .task-ul li {
  list-style: none;
}
.uploader-container .uploader-list .uploader-list-main .el-table {
  padding: 10px;
}
.uploader-container .uploader-list .uploader-list-main .el-table i {
  font-size: 30px;
  cursor: pointer;
}
.table-operate i + i {
  padding-left: 5px;
}
.table-operate i:hover {
  color: #5cb6ff;
}

.table-operate i {
  cursor: pointer;
  font-size: 22px;
  color: #2275d7;
}
.uploader-container .uploader-list .uploader-list-main .item-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  white-space: nowrap;
}
.uploader-container .uploader-list .uploader-list-main .item-name i {
  display: inline;
  padding-right: 5px;
}
.uploader-container .uploader-list .uploader-list-main .list-row {
  padding: 8px 10px;
  text-align: left;
  font-size: 16px;
  align-items: center;
}
.uploader-container .uploader-list .uploader-list-main .list-row :hover {
  background-color: #f5f7fa;
}
#filePicker,
#dirPicker {
  visibility: hidden;
  position: absolute;
  width: 1px;
  height: 1px;
}
</style>
