<template>
  <div class="uploader-container">
    <transition name="el-fade-in">
      <div class="uploader-drop" id="uploader-drop" v-show="showDrop">
        <div class="uploader-drop-header" v-if="showDropheader">
          <div class="header-back">
            <a href="javascript:void(0)" @click="showDrop = false"> <i class="el-icon-back"></i> Back </a>
          </div>
          <div class="header-title">Add more files</div>
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
      <div class="uploader-list" v-show="!showDrop" v-loading="listLoading" element-loading-text="Loading ......">
        <div class="uploader-list-toolbar">
          <a href="javascript:void(0)" @click="confirmCancel()"> <i class="el-icon-delete"></i> Clear </a>
          <span v-if="!taskList.length"> No tasks </span>
          <span v-else> {{ finishedTaskNumber }} / {{ taskList.length }} tasks </span>
          <a href="javascript:void(0)" @click="showDrop = showDropheader = true"> <i class="el-icon-folder-add"></i> Add more </a>
        </div>
        <div class="uploader-list-main">
          <vxe-list v-if="taskList.length" ref="dataListRef" :height="445" :data="taskList" :oSize="15" auto-resize sync-resize>
            <template #default="{ items }">
              <div class="list-row" v-for="(item, index) in items" :key="item.id" :taskstatus="item.status">
                <el-row :gutter="15">
                  <el-col :span="2">
                    <div class="list-row-index"> {{ taskList.indexOf(item) + 1 }}. </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="item-name">
                      <i class="el-icon-document" v-if="item.type === 'file'"></i>
                      <i class="el-icon-folder" v-else></i>
                      <el-tooltip class="item" effect="dark" :content="item.name" placement="bottom">
                        <span>{{ item.name }}</span>
                      </el-tooltip>
                    </div>
                  </el-col>
                  <el-col :span="4" class="text-align-end">
                    <span>{{ `${formatSize(item.uploaded)}/${formatSize(item.fileSize)}` }}</span>
                  </el-col>
                  <el-col :span="6" class="text-align-start">
                    <el-progress :percentage="item.progress" :status="item.status === 'error' ? 'exception' : ''"></el-progress>
                  </el-col>
                  <el-col :span="2">
                    <div class="text-align-start">{{ item.status }}</div>
                  </el-col>
                  <el-col :span="2" class="text-align-start">
                    <div class="table-operate">
                      <i v-if="item.status === 'pause'" class="el-icon-upload2" @click="execTask(item)"></i>
                      <i v-if="item.status === 'uploading' || item.status === 'waiting'" class="el-icon-video-pause" @click="pauseTask(item)"></i>
                      <i v-show="false" v-if="item.status === 'complete'" class="el-icon-check"></i>
                      <i v-if="item.status === 'error'" class="el-icon-refresh-left" @click="retryTask(item)"></i>
                      <i class="el-icon-close" @click="confirmCancel(item)"></i>
                      <i class="el-icon-loading" v-if="!item.extraInfo.presisted"></i>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </template>
          </vxe-list>

          <!-- <div v-if="lazyTaskList.length" v-infinite-scroll="loadMoreTasks" :infinite-scroll-distance="120" :infinite-scroll-delay="0">
            <div class="list-row" v-for="(item, index) in lazyTaskList" :key="item.id" :taskstatus="item.status">
              <el-row :gutter="15">
                <el-col :span="2">
                  <div class="list-row-index" :title="index + 1"> {{ index + 1 }}. </div>
                </el-col>
                <el-col :span="8">
                  <div class="item-name">
                    <i class="el-icon-document" v-if="item.type === 'file'"></i>
                    <i class=" el-icon-folder" v-else></i>
                    <el-tooltip class="item" effect="dark" :content="item.name" placement="bottom">
                      <span>{{ item.name }}</span>
                    </el-tooltip>
                  </div>
                </el-col>
                <el-col :span="4" class="text-align-end">
                  <span>{{ `${formatSize(item.uploaded)}/${formatSize(item.fileSize)}` }}</span>
                </el-col>
                <el-col :span="6" class="text-align-start">
                  <el-progress :percentage="item.progress" :status="item.status === 'error' ? 'exception' : ''"></el-progress>
                </el-col>
                <el-col :span="2">
                  <div class="text-align-start">{{ item.status }}</div>
                </el-col>
                <el-col :span="2" class="text-align-center">
                  <div class="table-operate">
                    <i v-if="item.status === 'pause'" class="el-icon-upload2" @click="execTask(item)"></i>
                    <i v-if="item.status === 'uploading' || item.status === 'waiting'" class="el-icon-video-pause" @click="pauseTask(item)"></i>
                    <i v-show="false" v-if="item.status === 'complete'" class="el-icon-check"></i>
                    <i v-if="item.status === 'error'" class="el-icon-refresh-left" @click="retryTask(item)"></i>
                    <i class="el-icon-close" @click="confirmCancel(item)"></i>
                    <i class="el-icon-loading" v-if="!item.extraInfo.presisted"></i>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div> -->
        </div>
        <div class="uploader-list-footer">
          <el-button v-if="!isUploading" :loading="uploadBtnLoading" type="primary" size="medium" @click="execTask()">Upload</el-button>
          <el-button v-else type="primary" size="medium" :loading="pauseBtnLoading" @click="pauseTask()">Pause</el-button>
          <el-button v-if="false" type="danger" size="medium" @click="confirmCancel">Clear</el-button>
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
    Storage,
    FileStore,
    scheduleWork,
    StatusCode,
    OSSProvider,
    OssOptions,
  } from '../../../rx-uploader/src/index'
  import { defineComponent, getCurrentInstance, nextTick, onMounted, onUnmounted, reactive, ref, SetupContext, toRefs, watchEffect } from 'vue'
  import { ElMessageBox } from 'element-plus'
  import type { VxeListInstance } from 'vxe-table'

  import { ajax } from 'rxjs/ajax'
  import { Observable } from 'rxjs'

  interface State {
    taskList: UploadTask[]
    lazyTaskList: UploadTask[]
    showDrop: boolean
    showDropheader: boolean
    isUploading: boolean
    uploadBtnLoading: boolean
    pauseBtnLoading: boolean
    finishedTaskNumber: number
    listLoading: boolean
  }

  const qiniuConfig = {
    region: 'cn-south-1',
    credentials: {
      accessKeyId: 'RiBF4yjXwDtBtMXAzj44Adwc0PDb3n_thaivKchC',
      secretAccessKey: 'XIcu9yyCexnaKhfB0Dyy1P-xsn_hfFA7gVZ4IVyo',
    },
    endpoint: {
      protocol: location.protocol,
      hostname: `s3test.s3-cn-south-1.qiniucs.com`,
    },
  }

  const testS3Config = qiniuConfig

  export default defineComponent({
    name: 'Uploader',
    emits: [...Object.values(EventType)],

    setup(props, ctx: SetupContext) {
      console.log('Uploader.............................', getCurrentInstance())
      const state = reactive<State>({
        taskList: reactive([]),
        lazyTaskList: reactive([]),
        showDrop: true,
        showDropheader: false,
        isUploading: false,
        uploadBtnLoading: false,
        pauseBtnLoading: false,
        finishedTaskNumber: 0,
        listLoading: false,
      })
      const dataListRef = ref<Nullable<VxeListInstance>>(null)
      console.log('🚀 ~ file: Uploader.vue ~ line 136 ~ setup ~ state', state)

      const authHeaders = {
        CMPID: 'f05dd7da36ba4e238f9c1f053c2e76e3',
        GUID: '787845727d8345289a9bdc97de6e8556',
        TOKEN:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlY20gY2xpZW50IiwiaXNzIjoienZpbmciLCJjbGFpbURlZmF1bHRLZXkiOiJhZG1pbiIsImV4cCI6MTYxMjY4NjE2MCwiaWF0IjoxNjEyMDgxMzYwLCJqdGkiOiIxYzlmNTNiNzZjYWE0Y2I4OWRjMGEzY2RlOGQyMjBkOSJ9.LhIX33fE9DSeSmB6xF4WqjKSVK_yIjBU29C7c-Iw0sI',
      }

      const ossOptions: OssOptions = {
        enable: true,
        provider: OSSProvider.S3,
        s3Config: () => {
          return Promise.resolve(testS3Config)
        },
        keyGenerator: (file: UploadFile) => {
          return encodeURIComponent(file.name)
        },
        uptokenGenerator: async (file: UploadFile) => {
          let url = 'http://saas.test.work.zving.com/server/companys/f05dd7da36ba4e238f9c1f053c2e76e3/oss/client/uptoken'
          url = `${url}?fileName=${file.name}&fileSize=${file.size}&relativePath=${file.relativePath}`
          let ob$: Observable<{ key: string; token: string }> = ajax.getJSON(url, authHeaders)
          const res = await ob$.toPromise()
          console.log('uptokenGenerator -> res', res)
          file.extraInfo.oss = res
          return res.token
        },
      }
      const options: UploaderOptions = {
        requestOptions: {
          // url: "https://jsonplaceholder.typicode.com/posts/",
          url: 'http://ecm.test.work.zving.com/catalogs/4751/files/upload',
          headers() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(authHeaders)
              }, 200)
            })
          },
          body: (task: UploadTask, uploadfile: UploadFile, chunk: FileChunk, baseParams: Obj) => {
            return Object.assign(baseParams, {
              chunkNumber: baseParams.chunkIndex + 1,
              identifier: uploadfile.id,
              filename: uploadfile.name,
              totalChunks: uploadfile.chunkIDList?.length,
            })
          },
        },
        ossOptions,
        fileFilter: (fileName: string) => !/^.DS_Store$/.test(fileName),
        computeFileHash: true,
        computeChunkHash: true,
        taskConcurrency: 5,
        chunkConcurrency: 3,
        resumable: false,
        singleFileTask: true,
        maxRetryTimes: 3,
        retryInterval: 3000,
        skipTaskWhenUploadError: true,
        beforeFileUploadComplete: (task: UploadTask, file: UploadFile) => {
          if (task) {
            return
          }
          if (ossOptions.enable) {
            let url = 'http://saas.test.work.zving.com/server/companys/f05dd7da36ba4e238f9c1f053c2e76e3/directorys/1658/files/upload'
            let params = {
              filename: file.name,
              identifier: file.id,
              relativePath: file.relativePath,
              totalSize: file.size,
              dao: file.response,
              stats: {
                atimeMs: file.lastModified,
                mtimeMs: file.lastModified,
                size: file.size,
              },
            }
            return ajax({
              url,
              method: 'POST',
              headers: {
                ...authHeaders,
                'Content-Type': 'application/json;charset=UTF-8',
              },
              body: params,
            }).toPromise()
          }
        },
      }

      const uploader: Uploader = Uploader.create(options)

      // TODO
      Object.assign(window, { uploader, FileStore })

      const checkUploading = (): boolean => {
        state.isUploading = uploader.isUploading()
        nextTick(() => {
          state.pauseBtnLoading = !state.isUploading
          state.uploadBtnLoading = state.isUploading
        })
        return state.isUploading
      }

      const calcFinishedTaskNumber = (): number => {
        state.finishedTaskNumber = state.taskList.filter((i) => i.status === StatusCode.Complete).length
        return state.finishedTaskNumber
      }

      const findTask = (id: ID): Nullable<UploadTask> => {
        return state.taskList.find((item) => item.id === id) || null
      }

      const findTaskIndex = (id: ID): number => {
        return state.taskList.findIndex((item) => item.id === id)
      }

      const mergeTaskAttr = (task: UploadTask) => {
        if (task) {
          const current: Nullable<UploadTask> = findTask(task.id)
          current && Object.assign(current, task)
        }
      }

      const addOrUpdateTask = (inputTask: UploadTask): UploadTask => {
        const task = findTask(inputTask.id)
        task ? Object.assign(task, inputTask) : state.taskList.push(inputTask)
        if (!state.lazyTaskList.length) {
          state.lazyTaskList.push(task || inputTask)
        }
        nextTick(() => {
          state.listLoading = false
          dataListRef.value?.reloadData(state.taskList)
        })

        return task || inputTask
      }

      const loadMoreTasks = () => {
        scheduleWork(() => {
          let index = Math.max(state.lazyTaskList.length, 1)
          state.lazyTaskList.push(...state.taskList.slice(index, index + 50))
        }, 500)
      }

      const eventHandler = (eventType: EventType, ...args: unknown[]) => {
        let task: Nullable<UploadTask>
        let index: number
        switch (eventType) {
          case EventType.TaskCreated:
            task = addOrUpdateTask(Object.assign({}, args[0]) as UploadTask)
            task.extraInfo.presisted = !options.resumable
            break
          case EventType.TaskRestore:
            task = addOrUpdateTask(Object.assign({}, args[0]) as UploadTask)
            task.extraInfo.presisted = true
            break
          case EventType.TaskPresist:
            task = findTask((args[0] as UploadTask).id)
            if (task) {
              task.extraInfo.presisted = true
            }
            console.log('EventType.TaskPresist', task)
            break
          case EventType.TaskCancel:
            task = args[0] as UploadTask
            index = findTaskIndex(task?.id)
            index !== -1 && state.taskList.splice(index, 1)
            index = state.lazyTaskList.findIndex((tsk) => tsk.id === task?.id)
            index !== -1 && state.lazyTaskList.splice(index, 1)
            break
          case EventType.TaskUploadStart:
            mergeTaskAttr(args[0] as UploadTask)
            break
          case EventType.TaskProgress:
            mergeTaskAttr(args[0] as UploadTask)
            break
          case EventType.TaskPause:
            mergeTaskAttr(args[0] as UploadTask)
            break
          case EventType.TaskUpdate:
            mergeTaskAttr(args[0] as UploadTask)
            break
          case EventType.TaskWaiting:
            mergeTaskAttr(args[0] as UploadTask)
            break
          case EventType.TaskComplete:
            mergeTaskAttr(args[0] as UploadTask)
            scheduleWork(() => calcFinishedTaskNumber(), 1000)
            break
          case EventType.TaskError:
            mergeTaskAttr(args[0] as UploadTask)
            break
        }
        ctx.emit(String(eventType), ...args)

        checkUploading()
      }

      Object.values(EventType).forEach((e) => uploader.on(e, (...args) => eventHandler(e, ...args)))

      let filePicker: Nullable<HTMLInputElement> = null
      let dirPicker: Nullable<HTMLInputElement> = null

      const chooseFiles = () => filePicker?.click()
      const chooseDir = () => dirPicker?.click()
      const initFilePickersAndDraggers = () => {
        const dropEl = document.querySelector('#uploader-drop') || document.body
        uploader.options.fileDragger = {
          $el: dropEl as HTMLElement,
          onDragenter: () => {
            dropEl.classList.add('uploader-drop-hover')
          },
          onDragleave: (e: DragEvent) => {
            let relatedTarget: Nullable<HTMLElement> = e.relatedTarget ? (e.relatedTarget as HTMLElement) : null
            let removeClass = () => dropEl.classList.remove('uploader-drop-hover')
            if (relatedTarget && relatedTarget.id !== dropEl.id) {
              let parent: Nullable<HTMLElement> = relatedTarget?.parentElement
              while (parent && parent.id !== dropEl.id) {
                parent = parent?.parentElement || null
              }
              parent?.id !== dropEl.id && removeClass()
            } else {
              !relatedTarget && removeClass()
            }
          },
          onDrop: () => {
            dropEl.classList.remove('uploader-drop-hover')
            state.showDrop = false
            state.listLoading = true
          },
        }
        const hideDrop = () => {
          state.showDrop = false
        }
        filePicker = document.querySelector('#filePicker') as HTMLInputElement
        dirPicker = document.querySelector('#dirPicker') as HTMLInputElement
        filePicker.addEventListener('change', hideDrop)
        dirPicker.addEventListener('change', hideDrop)
        uploader.options.filePicker = [
          { $el: filePicker, multiple: true, directory: false },
          { $el: dirPicker, multiple: true, directory: true },
        ]
        uploader.initFilePickersAndDraggers()
      }

      const confirmCancel = (task?: UploadTask) => {
        ElMessageBox.confirm(`Do you confirm to cancel ${task?.name || 'all tasks'} ?`, 'Warning', {
          type: 'warning',
        })
          .then(() => cancelTask(task))
          .catch(() => {
            console.log('cancel')
          })
      }

      const getRawTask = (id?: ID) => uploader.taskQueue.find((i) => i.id === id)

      const execTask = (task?: UploadTask) => {
        state.uploadBtnLoading = true
        setTimeout(() => {
          uploader.upload(getRawTask(task?.id))
          nextTick(() => checkUploading())
        }, 200)
      }

      const pauseTask = (task?: UploadTask) => {
        state.pauseBtnLoading = true
        setTimeout(() => {
          uploader.pause(getRawTask(task?.id))
          nextTick(() => checkUploading())
        }, 200)
      }

      const cancelTask = (task?: UploadTask) => {
        uploader.cancel(getRawTask(task?.id))
        setTimeout(() => {
          dataListRef.value?.recalculate()
          nextTick(() => checkUploading())
        }, 200)
      }

      const retryTask = (task?: UploadTask) => {
        uploader.retry(getRawTask(task?.id))
        checkUploading()
      }

      const formatSize = (size: number): string => {
        size = isNaN(size) || size === Infinity ? 0 : size
        if (size < 1024) {
          return size.toFixed(0) + ' B'
        }
        if (size < 1024 ** 2) {
          return (size / 1024.0).toFixed(0) + ' K'
        }
        if (size < 1024 ** 3) {
          return (size / 1024.0 / 1024.0).toFixed(1) + ' M'
        }
        return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' G'
      }

      const getStatusText = (statusCode: StatusCode): string => {
        switch (statusCode) {
          case StatusCode.Pause:
            return '已暂停'
          case StatusCode.Waiting:
            return '排队中'
          case StatusCode.Uploading:
            return '上传中'
          case StatusCode.Error:
            return '出错'
          case StatusCode.Complete:
            return '完成'
          default:
            return ''
        }
      }

      const doSomeEffectBeforeCreated = () => {
        if (options.resumable) {
          Storage.UploadTask.length().then((len: number) => {
            state.showDrop = !len
          })
        }
      }
      doSomeEffectBeforeCreated()

      watchEffect(() => {
        state.showDrop = !state.taskList.length
      })

      onMounted(() => {
        initFilePickersAndDraggers()
      })

      onUnmounted(() => {
        Object.values(EventType).forEach((e) => uploader.off(e))
        uploader.destory()
      })

      return {
        chooseFiles,
        chooseDir,
        confirmCancel,
        execTask,
        pauseTask,
        cancelTask,
        retryTask,
        formatSize,
        loadMoreTasks,
        getStatusText,
        ...toRefs(state),
        StatusCode,
        dataListRef,
      }
    },
  })
</script>
<style scoped>
  .uploader-container {
    width: 850px;
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
    border: 3px dashed #409eff !important;
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
    height: 50px;
    justify-content: flex-end;
  }

  .uploader-container .uploader-list .uploader-list-main {
    width: 100%;
    height: calc(100% - 50px - 50px);
    overflow: hidden;
    /* overflow-y: scroll;
    overflow-x: hidden; */
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
    font-size: 18px;
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
    color: #909399;
  }
  .uploader-container .uploader-list .uploader-list-main .list-row {
    /* padding: 8px 10px; */
    height: 35px;
    line-height: 35px;
    margin: 2px 8px;
    text-align: left;
    font-size: 14px;
    align-items: center;
    color: #606266;
  }
  .uploader-list-main .list-row[taskstatus='error'],
  .uploader-list-main .list-row[taskstatus='error']:hover {
    background: #ffe0e0;
  }

  /* ffe0e0 */

  .uploader-container .uploader-list .uploader-list-main .list-row .list-row-index {
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
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
  .text-align-center {
    text-align: center;
    align-self: center;
  }
  .text-align-end {
    text-align: end;
    align-self: center;
  }
  .text-align-start {
    text-align: start;
    align-self: center;
  }
</style>
