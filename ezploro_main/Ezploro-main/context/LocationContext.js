import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useEvents } from "./EventContext"

const DEFAULT_COORDINATES = {
  latitude: 18.492972574394607,
  longitude: -69.90878456827315,
}

const DEFAULT_CITY = "Santo Domingo, Dominican Republic"

const STORAGE_KEYS = {
  LOCATION: "userLocation",
  CITY: "cityName",
  MANUAL: "isManualLocation",
}

const LocationContext = createContext(null)

const isValidCoords = (coords = {}) =>
  typeof coords.latitude === "number" && typeof coords.longitude === "number"

export const LocationProvider = ({ children }) => {
  const { fetchEvents } = useEvents()

  const [location, setLocation] = useState(DEFAULT_COORDINATES)
  const [cityName, setCityName] = useState(DEFAULT_CITY)
  const [isManualLocation, setIsManualLocation] = useState(false)
  const [isLocationReady, setIsLocationReady] = useState(false)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

  const locationRef = useRef(DEFAULT_COORDINATES)

  const persistLocation = useCallback(async ({ coords, city, manual }) => {
    try {
      const tasks = [
        AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(coords)),
        AsyncStorage.setItem(STORAGE_KEYS.MANUAL, manual ? "true" : "false"),
      ]

      if (city) {
        tasks.push(AsyncStorage.setItem(STORAGE_KEYS.CITY, city))
      }

      await Promise.all(tasks)
    } catch (error) {
      console.warn("LocationContext: error persistiendo ubicación:", error)
    }
  }, [])

  const refreshEvents = useCallback(
    async (params = {}, { coordinates, showLoader = false } = {}) => {
      const coords = coordinates || locationRef.current
      if (!isValidCoords(coords)) return

      const requestParams = { ...params }
      if (requestParams.latitude === undefined) {
        requestParams.latitude = coords.latitude
      }
      if (requestParams.longitude === undefined) {
        requestParams.longitude = coords.longitude
      }

      if (showLoader) setIsUpdatingLocation(true)

      try {
        await fetchEvents(requestParams)
      } catch (error) {
        console.warn("LocationContext: error refrescando eventos:", error)
      } finally {
        if (showLoader) setIsUpdatingLocation(false)
      }
    },
    [fetchEvents]
  )

  const applyLocation = useCallback(
    async ({
      coords,
      city,
      manual = false,
      persist = true,
      triggerFetch = true,
      showLoader = true,
    }) => {
      if (!isValidCoords(coords)) return

      locationRef.current = coords
      setLocation(coords)
      if (city) setCityName(city)
      if (typeof manual === "boolean") setIsManualLocation(manual)

      if (persist) {
        await persistLocation({
          coords,
          city: city || cityName,
          manual,
        })
      }

      if (triggerFetch) {
        await refreshEvents({}, { coordinates: coords, showLoader })
      }
    },
    [cityName, persistLocation, refreshEvents]
  )

  const bootstrapLocation = useCallback(async () => {
    try {
      const [storedCoordsRaw, storedCity, storedManual] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LOCATION),
        AsyncStorage.getItem(STORAGE_KEYS.CITY),
        AsyncStorage.getItem(STORAGE_KEYS.MANUAL),
      ])

      let coords = DEFAULT_COORDINATES
      let manual = false
      if (storedCoordsRaw) {
        try {
          const parsed = JSON.parse(storedCoordsRaw)
          if (isValidCoords(parsed)) {
            coords = parsed
          }
        } catch (error) {
          console.warn("LocationContext: error parseando ubicación almacenada:", error)
        }
      }

      if (storedManual === "true") {
        manual = true
      }

      const city = storedCity || DEFAULT_CITY

      locationRef.current = coords
      setLocation(coords)
      setCityName(city)
      setIsManualLocation(manual)

      await refreshEvents({}, { coordinates: coords, showLoader: false })
    } catch (error) {
      console.warn("LocationContext: error inicializando ubicación:", error)
      await refreshEvents({}, { coordinates: DEFAULT_COORDINATES, showLoader: false })
    } finally {
      setIsLocationReady(true)
    }
  }, [refreshEvents])

  useEffect(() => {
    bootstrapLocation()
  }, [bootstrapLocation])

  const setManualLocation = useCallback(
    async ({ coordinates, name }) => {
      if (!isValidCoords(coordinates)) return
      await applyLocation({
        coords: coordinates,
        city: name || cityName,
        manual: true,
        triggerFetch: true,
        showLoader: true,
      })
    },
    [applyLocation, cityName]
  )

  const useCurrentLocation = useCallback(async () => {
    try {
      setIsUpdatingLocation(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        console.warn("LocationContext: permisos de ubicación denegados")
        return { granted: false }
      }

      const position = await Location.getCurrentPositionAsync({})
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      let resolvedCity = cityName
      try {
        const [reverse] = await Location.reverseGeocodeAsync(coords)
        if (reverse) {
          const baseCity = reverse.city || reverse.subregion || "Unknown"
          const country = reverse.country || ""
          resolvedCity = country ? `${baseCity}, ${country}` : baseCity
        }
      } catch (error) {
        console.warn("LocationContext: error obteniendo nombre de ciudad:", error)
      }

      await applyLocation({
        coords,
        city: resolvedCity,
        manual: false,
        triggerFetch: true,
        showLoader: false,
      })

      return { granted: true, coordinates: coords }
    } catch (error) {
      console.error("LocationContext: error obteniendo ubicación actual:", error)
      return { granted: false, error }
    } finally {
      setIsUpdatingLocation(false)
    }
  }, [applyLocation, cityName])

  const setLocationFromCoordinates = useCallback(
    async (coords, options = {}) => {
      await applyLocation({
        coords,
        city: options.city || cityName,
        manual: options.manual ?? isManualLocation,
        persist: options.persist ?? true,
        triggerFetch: options.triggerFetch ?? true,
        showLoader: options.showLoader ?? false,
      })
    },
    [applyLocation, cityName, isManualLocation]
  )

  const value = {
    location,
    cityName,
    isManualLocation,
    isLocationReady,
    isUpdatingLocation,
    setManualLocation,
    useCurrentLocation,
    refreshEventsWithLocation: refreshEvents,
    setLocationFromCoordinates,
  }

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export const useLocationContext = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error("useLocationContext debe usarse dentro de un LocationProvider")
  }
  return context
}

