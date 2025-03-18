import { defineStore } from 'pinia'

// useStore 可以是 useUser、useCart 之类的任何东西
// 第一个参数是应用程序中 store 的唯一 id
export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isLoading: false
  }),
  actions: {
    setLoading(value) {
      this.isLoading = value
    }
  },
  getters: {
    getLoadingState: (state) => state.isLoading
  }
})
