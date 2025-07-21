import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class AppStoreService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.appStoreConfigs = {};
    this.metadata = {};
    this.assets = {};
    this.reviewMonitoring = {};
    this.listeners = [];
    this.supportedStores = ['ios', 'android'];
    this.buildConfigs = {};
    this.submissionStatus = {};
  }

  static getInstance() {
    if (!AppStoreService.instance) {
      AppStoreService.instance = new AppStoreService();
    }
    return AppStoreService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadAppStoreConfigs();
      await this.loadMetadata();
      await this.loadAssets();
      await this.initializeSubmissionStatus();
      
      this.initialized = true;
      
      await this.auditService.logEvent('app_store_service_initialized', {
        timestamp: new Date().toISOString(),
        supported_stores: this.supportedStores,
        configs_loaded: Object.keys(this.appStoreConfigs).length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize AppStoreService:', error);
      throw error;
    }
  }

  async loadAppStoreConfigs() {
    try {
      const configs = await this.storageService.getItem('app_store_configs');
      this.appStoreConfigs = configs || {
        ios: {
          appId: process.env.EXPO_PUBLIC_IOS_APP_ID || '1234567890',
          bundleId: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.nightlife.navigator',
          teamId: process.env.EXPO_PUBLIC_IOS_TEAM_ID || 'ABC123DEF4',
          appStoreConnectApiKey: process.env.EXPO_PUBLIC_ASC_API_KEY || '',
          appStoreConnectIssuerId: process.env.EXPO_PUBLIC_ASC_ISSUER_ID || '',
          appStoreConnectKeyId: process.env.EXPO_PUBLIC_ASC_KEY_ID || '',
          certificates: {
            development: process.env.EXPO_PUBLIC_IOS_DEV_CERT || '',
            distribution: process.env.EXPO_PUBLIC_IOS_DIST_CERT || ''
          },
          provisioning: {
            development: process.env.EXPO_PUBLIC_IOS_DEV_PROFILE || '',
            distribution: process.env.EXPO_PUBLIC_IOS_DIST_PROFILE || ''
          }
        },
        android: {
          packageName: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.nightlife.navigator',
          applicationId: process.env.EXPO_PUBLIC_ANDROID_APP_ID || 'com.nightlife.navigator',
          playConsoleAccount: process.env.EXPO_PUBLIC_PLAY_CONSOLE_ACCOUNT || '',
          serviceAccountKey: process.env.EXPO_PUBLIC_PLAY_SERVICE_ACCOUNT_KEY || '',
          keystore: {
            path: process.env.EXPO_PUBLIC_ANDROID_KEYSTORE_PATH || '',
            password: process.env.EXPO_PUBLIC_ANDROID_KEYSTORE_PASSWORD || '',
            keyAlias: process.env.EXPO_PUBLIC_ANDROID_KEY_ALIAS || '',
            keyPassword: process.env.EXPO_PUBLIC_ANDROID_KEY_PASSWORD || ''
          },
          uploadKey: {
            path: process.env.EXPO_PUBLIC_ANDROID_UPLOAD_KEY_PATH || '',
            password: process.env.EXPO_PUBLIC_ANDROID_UPLOAD_KEY_PASSWORD || ''
          }
        }
      };
      
      await this.storageService.setItem('app_store_configs', this.appStoreConfigs);
    } catch (error) {
      console.error('Failed to load app store configs:', error);
      this.appStoreConfigs = {};
    }
  }

  async loadMetadata() {
    try {
      const metadata = await this.storageService.getItem('app_metadata');
      this.metadata = metadata || {
        common: {
          appName: 'Nightlife Navigator',
          version: '1.0.0',
          buildNumber: '1',
          shortDescription: 'Discover the best nightlife venues in your city',
          longDescription: 'Nightlife Navigator is the ultimate app for discovering and exploring the best bars, clubs, and entertainment venues in your city. Find events, make reservations, and connect with fellow nightlife enthusiasts.',
          keywords: ['nightlife', 'bars', 'clubs', 'events', 'entertainment', 'venues'],
          category: 'Lifestyle',
          contentRating: '17+',
          supportEmail: 'support@nightlife-navigator.com',
          supportUrl: 'https://nightlife-navigator.com/support',
          privacyPolicyUrl: 'https://nightlife-navigator.com/privacy',
          termsOfServiceUrl: 'https://nightlife-navigator.com/terms',
          websiteUrl: 'https://nightlife-navigator.com'
        },
        ios: {
          appName: 'Nightlife Navigator',
          subtitle: 'Discover Amazing Nightlife',
          primaryCategory: 'Lifestyle',
          secondaryCategory: 'Travel',
          contentRating: '17+',
          priceType: 'free',
          availability: {
            countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'JP'],
            regions: ['worldwide']
          },
          appStoreFeatures: {
            gameCenter: false,
            inAppPurchases: true,
            subscriptions: false,
            familySharing: true
          },
          reviewInformation: {
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+1-555-123-4567',
            email: 'review@nightlife-navigator.com',
            demoAccount: {
              username: 'demo@nightlife-navigator.com',
              password: 'DemoPass123!'
            }
          }
        },
        android: {
          appName: 'Nightlife Navigator',
          shortDescription: 'Discover the best nightlife venues',
          fullDescription: 'Nightlife Navigator is your ultimate companion for discovering and exploring the best bars, clubs, and entertainment venues in your city. Whether you\'re looking for a quiet cocktail bar, a high-energy dance club, or live music venues, our app helps you find the perfect spot for any occasion.\n\nFeatures:\n• Discover nearby venues with detailed information\n• Browse events and entertainment schedules\n• Make reservations directly through the app\n• Connect with other nightlife enthusiasts\n• Get personalized recommendations based on your preferences\n• Save your favorite venues for quick access\n• Real-time updates on venue availability and events\n\nDownload now and start exploring the nightlife scene in your city!',
          category: 'LIFESTYLE',
          contentRating: 'MATURE_17_PLUS',
          targetAudience: 'MATURE_17_PLUS',
          priceType: 'free',
          availability: {
            countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'JP'],
            excludedCountries: []
          },
          playStoreFeatures: {
            inAppPurchases: true,
            subscriptions: false,
            ads: false,
            dataCollection: true
          },
          contactDetails: {
            developerName: 'Nightlife Navigator Inc.',
            email: 'developer@nightlife-navigator.com',
            phone: '+1-555-123-4567',
            website: 'https://nightlife-navigator.com',
            address: '123 Tech Street, San Francisco, CA 94105'
          }
        }
      };
      
      await this.storageService.setItem('app_metadata', this.metadata);
    } catch (error) {
      console.error('Failed to load app metadata:', error);
      this.metadata = {};
    }
  }

  async loadAssets() {
    try {
      const assets = await this.storageService.getItem('app_assets');
      this.assets = assets || {
        icons: {
          ios: {
            appIcon: {
              '20x20': 'assets/icons/ios/icon-20.png',
              '29x29': 'assets/icons/ios/icon-29.png',
              '40x40': 'assets/icons/ios/icon-40.png',
              '58x58': 'assets/icons/ios/icon-58.png',
              '60x60': 'assets/icons/ios/icon-60.png',
              '76x76': 'assets/icons/ios/icon-76.png',
              '80x80': 'assets/icons/ios/icon-80.png',
              '87x87': 'assets/icons/ios/icon-87.png',
              '120x120': 'assets/icons/ios/icon-120.png',
              '152x152': 'assets/icons/ios/icon-152.png',
              '167x167': 'assets/icons/ios/icon-167.png',
              '180x180': 'assets/icons/ios/icon-180.png',
              '1024x1024': 'assets/icons/ios/icon-1024.png'
            },
            appStoreIcon: 'assets/icons/ios/app-store-icon.png'
          },
          android: {
            appIcon: {
              'mdpi': 'assets/icons/android/icon-mdpi.png',
              'hdpi': 'assets/icons/android/icon-hdpi.png',
              'xhdpi': 'assets/icons/android/icon-xhdpi.png',
              'xxhdpi': 'assets/icons/android/icon-xxhdpi.png',
              'xxxhdpi': 'assets/icons/android/icon-xxxhdpi.png'
            },
            adaptiveIcon: {
              foreground: 'assets/icons/android/adaptive-foreground.png',
              background: 'assets/icons/android/adaptive-background.png'
            },
            playStoreIcon: 'assets/icons/android/play-store-icon.png'
          }
        },
        screenshots: {
          ios: {
            'iPhone 6.5"': [
              'assets/screenshots/ios/iphone-6.5-1.png',
              'assets/screenshots/ios/iphone-6.5-2.png',
              'assets/screenshots/ios/iphone-6.5-3.png',
              'assets/screenshots/ios/iphone-6.5-4.png',
              'assets/screenshots/ios/iphone-6.5-5.png'
            ],
            'iPhone 5.5"': [
              'assets/screenshots/ios/iphone-5.5-1.png',
              'assets/screenshots/ios/iphone-5.5-2.png',
              'assets/screenshots/ios/iphone-5.5-3.png',
              'assets/screenshots/ios/iphone-5.5-4.png',
              'assets/screenshots/ios/iphone-5.5-5.png'
            ],
            'iPad Pro (12.9")': [
              'assets/screenshots/ios/ipad-pro-12.9-1.png',
              'assets/screenshots/ios/ipad-pro-12.9-2.png',
              'assets/screenshots/ios/ipad-pro-12.9-3.png',
              'assets/screenshots/ios/ipad-pro-12.9-4.png',
              'assets/screenshots/ios/ipad-pro-12.9-5.png'
            ]
          },
          android: {
            phone: [
              'assets/screenshots/android/phone-1.png',
              'assets/screenshots/android/phone-2.png',
              'assets/screenshots/android/phone-3.png',
              'assets/screenshots/android/phone-4.png',
              'assets/screenshots/android/phone-5.png'
            ],
            tablet: [
              'assets/screenshots/android/tablet-1.png',
              'assets/screenshots/android/tablet-2.png',
              'assets/screenshots/android/tablet-3.png',
              'assets/screenshots/android/tablet-4.png',
              'assets/screenshots/android/tablet-5.png'
            ]
          }
        },
        promotional: {
          ios: {
            appPreview: {
              'iPhone 6.5"': 'assets/promotional/ios/app-preview-iphone-6.5.mp4',
              'iPhone 5.5"': 'assets/promotional/ios/app-preview-iphone-5.5.mp4',
              'iPad Pro (12.9")': 'assets/promotional/ios/app-preview-ipad-pro-12.9.mp4'
            }
          },
          android: {
            featureGraphic: 'assets/promotional/android/feature-graphic.png',
            promoVideo: 'assets/promotional/android/promo-video.mp4'
          }
        }
      };
      
      await this.storageService.setItem('app_assets', this.assets);
    } catch (error) {
      console.error('Failed to load app assets:', error);
      this.assets = {};
    }
  }

  async initializeSubmissionStatus() {
    try {
      const status = await this.storageService.getItem('submission_status');
      this.submissionStatus = status || {
        ios: {
          currentVersion: '1.0.0',
          buildNumber: '1',
          status: 'not_submitted',
          submissionDate: null,
          reviewDate: null,
          releaseDate: null,
          rejectionReason: null,
          history: []
        },
        android: {
          currentVersion: '1.0.0',
          versionCode: 1,
          status: 'not_submitted',
          submissionDate: null,
          reviewDate: null,
          releaseDate: null,
          rejectionReason: null,
          history: []
        }
      };
      
      await this.storageService.setItem('submission_status', this.submissionStatus);
    } catch (error) {
      console.error('Failed to initialize submission status:', error);
      this.submissionStatus = {};
    }
  }

  async updateMetadata(platform, metadata) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const oldMetadata = JSON.parse(JSON.stringify(this.metadata[platform]));
      this.metadata[platform] = { ...this.metadata[platform], ...metadata };
      
      await this.storageService.setItem('app_metadata', this.metadata);
      
      await this.auditService.logEvent('app_metadata_updated', {
        platform: platform,
        old_metadata: oldMetadata,
        new_metadata: this.metadata[platform],
        timestamp: new Date().toISOString()
      });

      this.emit('metadataUpdated', { platform, metadata: this.metadata[platform] });
      return this.metadata[platform];
    } catch (error) {
      console.error('Failed to update metadata:', error);
      throw error;
    }
  }

  async updateAssets(platform, assetType, assets) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      if (!this.assets[assetType]) {
        this.assets[assetType] = {};
      }

      const oldAssets = JSON.parse(JSON.stringify(this.assets[assetType][platform]));
      this.assets[assetType][platform] = { ...this.assets[assetType][platform], ...assets };
      
      await this.storageService.setItem('app_assets', this.assets);
      
      await this.auditService.logEvent('app_assets_updated', {
        platform: platform,
        asset_type: assetType,
        old_assets: oldAssets,
        new_assets: this.assets[assetType][platform],
        timestamp: new Date().toISOString()
      });

      this.emit('assetsUpdated', { platform, assetType, assets: this.assets[assetType][platform] });
      return this.assets[assetType][platform];
    } catch (error) {
      console.error('Failed to update assets:', error);
      throw error;
    }
  }

  async prepareSubmission(platform, options = {}) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const submissionData = {
        platform: platform,
        version: options.version || this.metadata.common.version,
        buildNumber: options.buildNumber || this.metadata.common.buildNumber,
        metadata: this.metadata[platform],
        assets: this.assets,
        config: this.appStoreConfigs[platform],
        preparedAt: new Date().toISOString(),
        submissionOptions: options
      };

      const validation = await this.validateSubmission(platform, submissionData);
      if (!validation.valid) {
        throw new Error(`Submission validation failed: ${validation.errors.join(', ')}`);
      }

      await this.auditService.logEvent('app_submission_prepared', {
        platform: platform,
        submission_data: submissionData,
        validation: validation,
        timestamp: new Date().toISOString()
      });

      this.emit('submissionPrepared', { platform, submissionData, validation });
      return { submissionData, validation };
    } catch (error) {
      console.error('Failed to prepare submission:', error);
      throw error;
    }
  }

  async validateSubmission(platform, submissionData) {
    try {
      const validation = {
        valid: true,
        errors: [],
        warnings: []
      };

      const metadata = submissionData.metadata;
      const assets = submissionData.assets;
      const config = submissionData.config;

      if (platform === 'ios') {
        if (!metadata.appName || metadata.appName.trim() === '') {
          validation.errors.push('App name is required');
        }
        if (!metadata.primaryCategory) {
          validation.errors.push('Primary category is required');
        }
        if (!metadata.contentRating) {
          validation.errors.push('Content rating is required');
        }
        if (!config.bundleId) {
          validation.errors.push('Bundle ID is required');
        }
        if (!config.teamId) {
          validation.errors.push('Team ID is required');
        }
        if (!assets.icons?.ios?.appIcon?.['1024x1024']) {
          validation.errors.push('App Store icon (1024x1024) is required');
        }
        if (!assets.screenshots?.ios?.['iPhone 6.5"']?.length) {
          validation.errors.push('iPhone 6.5" screenshots are required');
        }
        if (!this.metadata.common.privacyPolicyUrl) {
          validation.errors.push('Privacy policy URL is required');
        }
      }

      if (platform === 'android') {
        if (!metadata.appName || metadata.appName.trim() === '') {
          validation.errors.push('App name is required');
        }
        if (!metadata.shortDescription || metadata.shortDescription.trim() === '') {
          validation.errors.push('Short description is required');
        }
        if (!metadata.fullDescription || metadata.fullDescription.trim() === '') {
          validation.errors.push('Full description is required');
        }
        if (!metadata.category) {
          validation.errors.push('Category is required');
        }
        if (!config.packageName) {
          validation.errors.push('Package name is required');
        }
        if (!assets.icons?.android?.playStoreIcon) {
          validation.errors.push('Play Store icon is required');
        }
        if (!assets.screenshots?.android?.phone?.length) {
          validation.errors.push('Phone screenshots are required');
        }
        if (!assets.promotional?.android?.featureGraphic) {
          validation.errors.push('Feature graphic is required');
        }
        if (!this.metadata.common.privacyPolicyUrl) {
          validation.errors.push('Privacy policy URL is required');
        }
      }

      if (validation.errors.length > 0) {
        validation.valid = false;
      }

      return validation;
    } catch (error) {
      console.error('Failed to validate submission:', error);
      return { valid: false, errors: ['Validation failed'], warnings: [] };
    }
  }

  async submitToStore(platform, submissionData, options = {}) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const submissionId = this.generateSubmissionId(platform);
      const submissionRecord = {
        id: submissionId,
        platform: platform,
        version: submissionData.version,
        buildNumber: submissionData.buildNumber,
        status: 'submitted',
        submissionDate: new Date().toISOString(),
        submissionData: submissionData,
        options: options
      };

      this.submissionStatus[platform].status = 'submitted';
      this.submissionStatus[platform].submissionDate = submissionRecord.submissionDate;
      this.submissionStatus[platform].history.push(submissionRecord);
      
      await this.storageService.setItem('submission_status', this.submissionStatus);

      await this.auditService.logEvent('app_submitted_to_store', {
        submission_id: submissionId,
        platform: platform,
        submission_record: submissionRecord,
        timestamp: new Date().toISOString()
      });

      this.emit('submittedToStore', { platform, submissionRecord });
      return submissionRecord;
    } catch (error) {
      console.error('Failed to submit to store:', error);
      throw error;
    }
  }

  async checkSubmissionStatus(platform) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const status = this.submissionStatus[platform];
      
      await this.auditService.logEvent('app_submission_status_checked', {
        platform: platform,
        status: status,
        timestamp: new Date().toISOString()
      });

      return status;
    } catch (error) {
      console.error('Failed to check submission status:', error);
      throw error;
    }
  }

  async updateSubmissionStatus(platform, newStatus, details = {}) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const oldStatus = this.submissionStatus[platform].status;
      this.submissionStatus[platform].status = newStatus;
      
      if (newStatus === 'in_review') {
        this.submissionStatus[platform].reviewDate = new Date().toISOString();
      } else if (newStatus === 'approved' || newStatus === 'ready_for_sale') {
        this.submissionStatus[platform].releaseDate = new Date().toISOString();
      } else if (newStatus === 'rejected') {
        this.submissionStatus[platform].rejectionReason = details.reason || 'No reason provided';
      }

      if (details.metadata) {
        Object.assign(this.submissionStatus[platform], details.metadata);
      }

      await this.storageService.setItem('submission_status', this.submissionStatus);

      await this.auditService.logEvent('app_submission_status_updated', {
        platform: platform,
        old_status: oldStatus,
        new_status: newStatus,
        details: details,
        timestamp: new Date().toISOString()
      });

      this.emit('submissionStatusUpdated', { platform, oldStatus, newStatus, details });
      return this.submissionStatus[platform];
    } catch (error) {
      console.error('Failed to update submission status:', error);
      throw error;
    }
  }

  async generateBuildConfiguration(platform, options = {}) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const config = {
        platform: platform,
        version: options.version || this.metadata.common.version,
        buildNumber: options.buildNumber || this.metadata.common.buildNumber,
        environment: options.environment || 'production',
        generatedAt: new Date().toISOString()
      };

      if (platform === 'ios') {
        config.ios = {
          bundleId: this.appStoreConfigs.ios.bundleId,
          teamId: this.appStoreConfigs.ios.teamId,
          provisioningProfile: this.appStoreConfigs.ios.provisioning.distribution,
          certificate: this.appStoreConfigs.ios.certificates.distribution,
          infoPlist: {
            CFBundleDisplayName: this.metadata.ios.appName,
            CFBundleShortVersionString: config.version,
            CFBundleVersion: config.buildNumber,
            NSLocationWhenInUseUsageDescription: 'This app uses location to find nearby nightlife venues',
            NSLocationAlwaysAndWhenInUseUsageDescription: 'This app uses location to find nearby nightlife venues',
            NSCameraUsageDescription: 'This app uses camera to take photos for reviews',
            NSPhotoLibraryUsageDescription: 'This app accesses photo library to select images for reviews',
            NSMicrophoneUsageDescription: 'This app uses microphone for voice features',
            NSUserTrackingUsageDescription: 'This app uses tracking to provide personalized recommendations'
          }
        };
      }

      if (platform === 'android') {
        config.android = {
          packageName: this.appStoreConfigs.android.packageName,
          versionCode: parseInt(config.buildNumber),
          versionName: config.version,
          keystore: this.appStoreConfigs.android.keystore,
          permissions: [
            'ACCESS_FINE_LOCATION',
            'ACCESS_COARSE_LOCATION',
            'CAMERA',
            'READ_EXTERNAL_STORAGE',
            'WRITE_EXTERNAL_STORAGE',
            'RECORD_AUDIO',
            'INTERNET',
            'ACCESS_NETWORK_STATE'
          ],
          targetSdkVersion: 33,
          minSdkVersion: 21
        };
      }

      this.buildConfigs[platform] = config;
      await this.storageService.setItem('build_configs', this.buildConfigs);

      await this.auditService.logEvent('build_configuration_generated', {
        platform: platform,
        config: config,
        timestamp: new Date().toISOString()
      });

      this.emit('buildConfigGenerated', { platform, config });
      return config;
    } catch (error) {
      console.error('Failed to generate build configuration:', error);
      throw error;
    }
  }

  async generateStoreListings(platform) {
    try {
      if (!this.supportedStores.includes(platform)) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const listing = {
        platform: platform,
        generatedAt: new Date().toISOString(),
        metadata: this.metadata[platform],
        assets: this.assets
      };

      if (platform === 'ios') {
        listing.appStoreConnect = {
          appInformation: {
            name: this.metadata.ios.appName,
            subtitle: this.metadata.ios.subtitle,
            bundleId: this.appStoreConfigs.ios.bundleId,
            primaryCategory: this.metadata.ios.primaryCategory,
            secondaryCategory: this.metadata.ios.secondaryCategory,
            contentRating: this.metadata.ios.contentRating
          },
          pricing: {
            priceType: this.metadata.ios.priceType,
            availability: this.metadata.ios.availability
          },
          appStoreInformation: {
            description: this.metadata.common.longDescription,
            keywords: this.metadata.common.keywords.join(', '),
            supportUrl: this.metadata.common.supportUrl,
            marketingUrl: this.metadata.common.websiteUrl,
            privacyPolicyUrl: this.metadata.common.privacyPolicyUrl
          },
          appReviewInformation: this.metadata.ios.reviewInformation
        };
      }

      if (platform === 'android') {
        listing.playConsole = {
          storeListingInformation: {
            appName: this.metadata.android.appName,
            shortDescription: this.metadata.android.shortDescription,
            fullDescription: this.metadata.android.fullDescription,
            category: this.metadata.android.category,
            tags: this.metadata.common.keywords
          },
          pricing: {
            priceType: this.metadata.android.priceType,
            availability: this.metadata.android.availability
          },
          contentRating: this.metadata.android.contentRating,
          contactDetails: this.metadata.android.contactDetails,
          privacyPolicy: this.metadata.common.privacyPolicyUrl
        };
      }

      await this.auditService.logEvent('store_listing_generated', {
        platform: platform,
        listing: listing,
        timestamp: new Date().toISOString()
      });

      this.emit('storeListingGenerated', { platform, listing });
      return listing;
    } catch (error) {
      console.error('Failed to generate store listing:', error);
      throw error;
    }
  }

  generateSubmissionId(platform) {
    return `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => listener.callback(data));
  }

  async cleanup() {
    try {
      this.listeners = [];
      this.appStoreConfigs = {};
      this.metadata = {};
      this.assets = {};
      this.buildConfigs = {};
      this.submissionStatus = {};
      this.initialized = false;
      
      await this.auditService.logEvent('app_store_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup AppStoreService:', error);
    }
  }
}

export { AppStoreService };