import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCustomer } from '../context/CustomerContext';
import { FiImage, FiUser, FiFileText, FiList, FiShield, FiTrash2, FiUsers, FiSearch, FiX, FiPlus, FiEdit2, FiDollarSign, FiSave } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [qrPreview, setQrPreview] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { customers, fetchCustomers } = useCustomer();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [originalDocumentType, setOriginalDocumentType] = useState(null);
  const [currentDocumentType, setCurrentDocumentType] = useState('invoice');
  const [payments, setPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [settings, setSettings] = useState({
    invoicePrefix: 'INV',
    quotePrefix: 'QUO',
    currency: 'MYR',
    companyLogo: '',
    showCompanyLogo: true
  });
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiShortLoading, setAiShortLoading] = useState(false);
  const [itemsMode, setItemsMode] = useState('structured'); // 'structured' or 'freeform'
  const [freeformAnalysis, setFreeformAnalysis] = useState({ totalAmount: 0, items: [] });
  const [modeDetectionComplete, setModeDetectionComplete] = useState(false);
  
  // Function to analyze freeform text and extract quantities and prices
  const analyzeFreeformText = (text) => {
    if (!text || text.trim() === '') return { totalAmount: 0, items: [] };
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    let totalAmount = 0;
    const items = [];
    
    // Regex patterns to detect prices and quantities
    const pricePattern = /RM\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*RM/gi;
    const quantityPattern = /(\d+(?:\.\d+)?)\s*(?:x|pcs|unit|buah|keping|set)/gi;
    
    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (cleanLine === '') return;
      
      // Extract prices from the line
      const priceMatches = [...cleanLine.matchAll(pricePattern)];
      const prices = priceMatches.map(match => {
        const price = match[1] || match[2];
        return parseFloat(price) || 0;
      });
      
      // Extract quantities from the line
      const quantityMatches = [...cleanLine.matchAll(quantityPattern)];
      const quantities = quantityMatches.map(match => parseFloat(match[1]) || 1);
      
      // Calculate line total
      let lineTotal = 0;
      if (prices.length > 0) {
        if (quantities.length > 0) {
          // If both quantity and price found, multiply them
          lineTotal = quantities.reduce((sum, qty, i) => sum + (qty * (prices[i] || prices[0] || 0)), 0);
        } else {
          // If only price found, use it as total
          lineTotal = prices.reduce((sum, price) => sum + price, 0);
        }
      }
      
      if (lineTotal > 0) {
        totalAmount += lineTotal;
        items.push({
          description: cleanLine,
          quantity: quantities.length > 0 ? quantities.reduce((sum, qty) => sum + qty, 0) : 1,
          unitPrice: prices.length > 0 ? prices[0] : 0,
          amount: lineTotal
        });
      } else {
        // If no price detected, add as description only
        items.push({
          description: cleanLine,
          quantity: 1,
          unitPrice: 0,
          amount: 0
        });
      }
    });
    
    return { totalAmount, items };
  };
  const DEFAULT_TERMS = `Terma dan Syarat:
1. Pembayaran hendaklah dibuat dalam tempoh 30 hari dari tarikh invois.
2. Bayaran lewat akan dikenakan faedah 1.5% sebulan.
3. Barang yang dihantar tidak boleh dipulangkan tanpa kebenaran bertulis.
4. Sebarang pertikaian akan diselesaikan mengikut undang-undang Malaysia.`;

  // Handle logo file upload and preview
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Saiz fail mesti kurang dari 2MB');
        event.target.value = '';
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Sila pilih fail imej sahaja');
        event.target.value = '';
        return;
      }

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('logo', file);

        // Upload file to server
        const response = await axios.post(`${API_BASE_URL}/api/invoices/upload-logo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          const logoPath = `${API_BASE_URL}${response.data.logoPath}`;
          setLogoPreview(logoPath);
          setValue('companyLogo', response.data.logoPath); // Store file path
          toast.success('Logo berjaya dimuat naik');
        }
      } catch (error) {
        console.error('Logo upload error:', error);
        toast.error('Gagal memuat naik logo');
        event.target.value = '';
      }
    }
  };

  // Remove logo preview
  const handleRemoveLogo = () => {
    setLogoPreview('');
    setValue('companyLogo', '');
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  // Upload Payment QR code
  const handleQrUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Saiz fail mesti kurang dari 2MB');
        event.target.value = '';
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Sila pilih fail imej sahaja');
        event.target.value = '';
        return;
      }

      try {
        const formData = new FormData();
        formData.append('qrcode', file);

        const headers = {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        };

        let response;
        try {
          response = await axios.post(`${API_BASE_URL}/api/uploads/qrcode`, formData, { headers });
        } catch (err) {
          // Fallback to legacy path if server not updated
          if (err?.response?.status === 404) {
            response = await axios.post(`${API_BASE_URL}/api/invoices/upload-qrcode`, formData, { headers });
          } else {
            throw err;
          }
        }

        if (response?.data?.success) {
          const qrPath = `${API_BASE_URL}${response.data.qrPath}`;
          setQrPreview(qrPath);
          setValue('paymentQRCode', response.data.qrPath);
          toast.success('Kod QR berjaya dimuat naik');
        } else {
          throw new Error('Invalid response');
        }
      } catch (error) {
        console.error('QR upload error:', error?.response?.data || error.message || error);
        toast.error(error?.response?.data?.message || 'Gagal memuat naik kod QR (404). Sila segar semula dan cuba lagi.');
        event.target.value = '';
      }
    }
  };

  const handleRemoveQr = () => {
    setQrPreview('');
    setValue('paymentQRCode', '');
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((inp) => {
      if (inp?.dataset?.purpose === 'qr') inp.value = '';
    });
  };

  // (moved watchedDocumentType and generator effect below useForm)

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings');
      if (raw) {
        const s = JSON.parse(raw);
        setSettings({
          invoicePrefix: s.invoicePrefix || 'INV',
          quotePrefix: s.quotePrefix || 'QUO',
          currency: s.currency || 'MYR',
          companyLogo: s.companyLogo || '',
          showCompanyLogo: s.showCompanyLogo !== undefined ? s.showCompanyLogo : true
        });
      }
    } catch (e) {
      // ignore malformed settings
    }
  }, []);

  // Handle customer pre-selection from URL parameter
  useEffect(() => {
    const customerId = searchParams.get('customer');
    if (customerId && customers.length > 0) {
      handleCustomerSelect(customerId);
    }
  }, [customers, searchParams]);

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customerId) => {
    if (customerId) {
      const customer = customers.find(c => c._id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setValue('clientName', customer.name);
        setValue('clientCompany', customer.company || '');
        setValue('clientEmail', customer.email);
        setValue('clientPhone', customer.phone || '');
        
        // Set address from customer data
        if (customer.address) {
          const addressParts = [];
          if (customer.address.street) addressParts.push(customer.address.street);
          if (customer.address.city) addressParts.push(customer.address.city);
          if (customer.address.state) addressParts.push(customer.address.state);
          if (customer.address.postalCode) addressParts.push(customer.address.postalCode);
          if (customer.address.country) addressParts.push(customer.address.country);
          setValue('clientAddress', addressParts.join(', '));
        }
      }
    } else {
      setSelectedCustomer(null);
      setValue('clientName', '');
      setValue('clientCompany', '');
      setValue('clientEmail', '');
      setValue('clientPhone', '');
      setValue('clientAddress', '');
    }
  };

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      // Document type
      documentType: 'invoice',
      // Sender information
      senderCompanyName: '',
      senderCompanyAddress: '',
      senderCompanyPhone: '',
      senderCompanyEmail: '',
      senderCompanyRegistrationNo: '',
      senderBankAccount: '',
      senderBankName: '',
      paymentQRCode: '',
      companyLogo: '',
      // Client information
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      clientAddress: '',
      clientPhone: '',
      dueDate: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
      freeformItems: '',
      tax: 0,
      taxType: 'amount',
      discount: 0,
      discountType: 'amount',
      amountPaid: 0,
      payments: [],
      notes: '',
      termsAndConditions: '',
      status: 'draft'
    }
  });

  // Watch document type for dynamic updates
  const watchedDocumentType = watch('documentType');
  
  // Debug logging for document type changes
  useEffect(() => {
    console.log('Document type changed to:', watchedDocumentType);
    console.log('Original document type:', originalDocumentType);
    console.log('Current document type:', currentDocumentType);
  }, [watchedDocumentType, originalDocumentType, currentDocumentType]);

  useEffect(() => {
    // Generate preview invoice/quote number for new documents
    if (!isEdit) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const docPrefix = watchedDocumentType === 'quote' ? settings.quotePrefix : settings.invoicePrefix;
      setPreviewInvoiceNumber(`${docPrefix}-${year}${month}-xxx`);
    }
  }, [isEdit, watchedDocumentType, settings]);


  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedFreeformItems = watch('freeformItems');
  const watchedTax = watch('tax');
  const watchedTaxType = watch('taxType');
  const watchedDiscount = watch('discount');
  const watchedDiscountType = watch('discountType');
  const watchedAmountPaid = watch('amountPaid');
  const watchedPayments = watch('payments');
  
  // Analyze freeform text when it changes
  useEffect(() => {
    if (itemsMode === 'freeform' && watchedFreeformItems) {
      const analysis = analyzeFreeformText(watchedFreeformItems);
      setFreeformAnalysis(analysis);
      console.log('Freeform analysis:', analysis);
    }
  }, [watchedFreeformItems, itemsMode]);

  useEffect(() => {
    if (isEdit) {
      fetchInvoice();
    } else {
      // For new invoices, mode detection is complete immediately
      setModeDetectionComplete(true);
    }
  }, [id, isEdit]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.startsWith('items.')) {
        const itemIndex = parseInt(name.split('.')[1]);
        if (name.endsWith('.quantity') || name.endsWith('.unitPrice')) {
          const quantity = parseFloat(value.items[itemIndex]?.quantity) || 0;
          const unitPrice = parseFloat(value.items[itemIndex]?.unitPrice) || 0;
          const amount = quantity * unitPrice;
          setValue(`items.${itemIndex}.amount`, amount);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/invoices/${id}`);
      const invoice = response.data;
      
      console.log('=== FETCH INVOICE DEBUG ===');
      console.log('Full invoice data:', invoice);
      console.log('Invoice amountPaid:', invoice.amountPaid);
      console.log('Invoice payments:', invoice.payments);
      
      // Set invoice number for display
      setPreviewInvoiceNumber(invoice.invoiceNumber);
      
      // Document type
      const docType = invoice.documentType || 'invoice';
      console.log('Fetched invoice document type:', docType);
      setValue('documentType', docType);
      setOriginalDocumentType(docType);
      setCurrentDocumentType(docType);
      
      // Sender company information
      setValue('senderCompanyName', invoice.senderCompanyName || '');
      setValue('senderCompanyAddress', invoice.senderCompanyAddress || '');
      setValue('senderCompanyPhone', invoice.senderCompanyPhone || '');
      setValue('senderCompanyEmail', invoice.senderCompanyEmail || '');
      setValue('senderCompanyRegistrationNo', invoice.senderCompanyRegistrationNo || '');
      if (docType === 'quote') {
        setValue('senderBankAccount', '');
        setValue('senderBankName', '');
      } else {
        setValue('senderBankAccount', invoice.senderBankAccount || '');
      setValue('senderBankName', invoice.senderBankName || '');
      setValue('paymentQRCode', invoice.paymentQRCode || '');
      }
      setValue('companyLogo', invoice.companyLogo || '');
      if (invoice.companyLogo) {
        // Check if it's a base64 string or file path
        if (invoice.companyLogo.startsWith('data:')) {
          // Base64 string (old format)
          setLogoPreview(invoice.companyLogo);
        } else {
          // File path (new format)
          const logoUrl = `${API_BASE_URL}${invoice.companyLogo}`;
          setLogoPreview(logoUrl);
        }
      }
      if (invoice.paymentQRCode) {
        const qrUrl = `${API_BASE_URL}${invoice.paymentQRCode}`;
        setQrPreview(qrUrl);
      }
      
      // Client information
      setValue('clientName', invoice.clientName);
      setValue('clientCompany', invoice.clientCompany || '');
      setValue('clientEmail', invoice.clientEmail);
      setValue('clientAddress', invoice.clientAddress);
      setValue('clientPhone', invoice.clientPhone || '');
      setValue('dueDate', new Date(invoice.dueDate).toISOString().split('T')[0]);
      setValue('freeformItems', invoice.freeformItems || '');
      setValue('tax', invoice.tax);
      setValue('discount', invoice.discount || 0);
      setValue('discountType', invoice.discountType || 'amount');
      
      // Detect items mode based on data BEFORE setting items
      // Priority: If freeformItems exists and has content, use freeform mode
      // Check if structured items are meaningful (not just auto-generated from freeform)
      const hasFreeformContent = invoice.freeformItems && invoice.freeformItems.trim() !== '';
      const hasStructuredContent = invoice.items && invoice.items.length > 0 && 
        invoice.items.some(item => item.description && item.description.trim() !== '');
      
      // Check if structured items look like they were auto-generated from freeform
      // (e.g., many items with unitPrice = 0, or items that match freeform content)
      const structuredItemsLookAutoGenerated = hasStructuredContent && hasFreeformContent && 
        invoice.items.filter(item => parseFloat(item.unitPrice) === 0).length > invoice.items.length * 0.5;
      
      console.log('Mode detection:', {
        hasFreeformContent,
        hasStructuredContent,
        structuredItemsLookAutoGenerated,
        freeformItems: invoice.freeformItems,
        itemsCount: invoice.items ? invoice.items.length : 0,
        itemsWithZeroPrice: invoice.items ? invoice.items.filter(item => parseFloat(item.unitPrice) === 0).length : 0
      });
      
      if (hasFreeformContent && (!hasStructuredContent || structuredItemsLookAutoGenerated)) {
        console.log('Detected freeform mode from invoice data (freeform content takes priority)');
        setItemsMode('freeform');
        // Clear structured items to avoid confusion - force empty array
        setValue('items', [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
        // Force UI update with correct freeform data
        setTimeout(() => {
          // Double-check and re-set freeform items
          setValue('freeformItems', invoice.freeformItems || '');
          setItemsMode('freeform'); // Re-enforce mode
          // Trigger analysis for the loaded freeform content
          const analysis = analyzeFreeformText(invoice.freeformItems);
          setFreeformAnalysis(analysis);
          console.log('Loaded freeform analysis:', analysis);
          console.log('Mode after timeout:', 'freeform');
          setModeDetectionComplete(true); // Mark detection as complete
        }, 200);
      } else if (hasStructuredContent && !hasFreeformContent) {
        console.log('Detected structured mode from invoice data');
        setItemsMode('structured');
        // Set structured items
        setValue('items', invoice.items);
        // Clear freeform items to avoid confusion
        setValue('freeformItems', '');
        setModeDetectionComplete(true); // Mark detection as complete
      } else {
        // Default to structured mode for new invoices
        console.log('No clear mode detected, defaulting to structured mode');
        setItemsMode('structured');
        // Set structured items if available, otherwise use default
        setValue('items', invoice.items || [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
        // Clear freeform items to avoid confusion
        setValue('freeformItems', '');
        setModeDetectionComplete(true); // Mark detection as complete
      }
      setValue('taxType', 'amount');
      setValue('amountPaid', (invoice.documentType === 'quote') ? 0 : (invoice.amountPaid || 0));
      
      // Handle payments data - check if it exists and is an array
      let paymentsData = [];
      if (docType !== 'quote' && invoice.payments && Array.isArray(invoice.payments)) {
        paymentsData = invoice.payments;
      } else if (docType !== 'quote' && invoice.amountPaid && invoice.amountPaid > 0) {
        // If no payments array but amountPaid exists, create a single payment record
        paymentsData = [{
          amount: invoice.amountPaid,
          date: invoice.updatedAt ? new Date(invoice.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          note: 'Pembayaran sedia ada'
        }];
      }
      
      console.log('Loading payments data:', paymentsData);
      setValue('payments', paymentsData);
      setPayments(paymentsData);
      setValue('notes', invoice.notes || '');
      setValue('termsAndConditions', invoice.termsAndConditions || DEFAULT_TERMS);
      setValue('status', invoice.status);
      
      console.log('Final mode set to:', itemsMode);
      console.log('Final items data:', watch('items'));
      console.log('Final freeform data:', watch('freeformItems'));
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Gagal memuat invois');
      navigate('/invoices');
    } finally {
      setFetchLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (itemsMode === 'freeform') {
      return freeformAnalysis.totalAmount;
    }
    return watchedItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    if (watchedTaxType === 'percent') {
      const percent = parseFloat(watchedTax) || 0;
      return subtotal * (percent / 100);
    }
    return parseFloat(watchedTax) || 0;
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (watchedDiscountType === 'percent') {
      const percent = parseFloat(watchedDiscount) || 0;
      return subtotal * (percent / 100);
    }
    return parseFloat(watchedDiscount) || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const taxAmount = calculateTaxAmount();
    return subtotal - discountAmount + taxAmount;
  };

  const calculateOutstandingAmount = () => {
    const total = calculateTotal();
    const totalPaid = calculateTotalPaid();
    return Math.max(0, total - totalPaid);
  };

  const calculateTotalPaid = () => {
    // Quotes do not accept payments
    if (watchedDocumentType === 'quote') return 0;
    // First try to calculate from payments array
    if (watchedPayments && watchedPayments.length > 0) {
      const totalFromPayments = watchedPayments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      if (totalFromPayments > 0) {
        return totalFromPayments;
      }
    }
    
    // Fallback to amountPaid if no payments array or empty
    return parseFloat(watchedAmountPaid) || 0;
  };

  // Payment management functions
  const handleAddPayment = () => {
    if (watchedDocumentType === 'quote') {
      toast.error('Sebut harga tidak menerima pembayaran');
      return;
    }
    setEditingPayment(null);
    setShowPaymentModal(true);
  };

  const handleEditPayment = (payment, index) => {
    setEditingPayment({ 
      ...payment, 
      index,
      _id: payment._id || payment.id // Ensure we have the correct ID field
    });
    setShowPaymentModal(true);
  };

  const handleDeletePayment = (index) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
    setValue('payments', newPayments);
    toast.success('Pembayaran telah dihapus');
  };

  const handleSavePayment = (paymentData) => {
    console.log('=== SAVE PAYMENT DEBUG ===');
    console.log('Payment data received:', paymentData);
    console.log('Payment date:', paymentData.date);
    
    const newPayments = [...payments];
    
    if (editingPayment !== null) {
      // Edit existing payment - keep existing _id if it exists
      newPayments[editingPayment.index] = {
        ...paymentData,
        _id: editingPayment._id || editingPayment.id // Keep existing ID
      };
      console.log('Updated payment at index', editingPayment.index, ':', newPayments[editingPayment.index]);
      toast.success('Pembayaran telah dikemaskini');
    } else {
      // Add new payment - use the date from paymentData, not current date
      newPayments.push({
        ...paymentData
        // Don't override the date - use the date from paymentData
      });
      console.log('Added new payment:', newPayments[newPayments.length - 1]);
      toast.success('Pembayaran telah ditambah');
    }
    
    console.log('Final payments array:', newPayments);
    setPayments(newPayments);
    setValue('payments', newPayments);
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  const onSubmit = async (data) => {
    console.log('=== FRONTEND SUBMIT DEBUG ===');
    console.log('Form data received:', JSON.stringify(data, null, 2));
    
    setLoading(true);
    
    try {
      // Check sender company info
      if (!data.senderCompanyName || !data.senderCompanyAddress || !data.senderCompanyEmail) {
        toast.error('Sila lengkapkan maklumat syarikat pengirim');
        setLoading(false);
        return;
      }

      // Validate items based on mode
      if (itemsMode === 'structured') {
        // Validate structured table items
        if (!data.items || data.items.length === 0) {
          toast.error('Sila tambah sekurang-kurangnya satu item');
          setLoading(false);
          return;
        }

        // Check if all items have required fields
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          console.log(`Validating item ${i}:`, item);
          
          if (!item.description || !item.quantity || !item.unitPrice) {
            toast.error(`Item ${i + 1}: Sila lengkapkan penerangan, kuantiti, dan harga unit`);
            setLoading(false);
            return;
          }
          if (parseFloat(item.quantity) <= 0) {
            toast.error(`Item ${i + 1}: Kuantiti mesti lebih daripada 0`);
            setLoading(false);
            return;
          }
          if (parseFloat(item.unitPrice) < 0) {
            toast.error(`Item ${i + 1}: Harga unit tidak boleh negatif`);
            setLoading(false);
            return;
          }
        }
      } else {
        // Validate freeform text
        if (!data.freeformItems || data.freeformItems.trim() === '') {
          toast.error('Sila masukkan penerangan item dalam mod teks bebas');
          setLoading(false);
          return;
        }
      }

      // Build items and compute absolute tax amount (RM) based on selected type
      let computedItems = [];
      let tmpSubtotal = 0;
      
      if (itemsMode === 'freeform') {
        // For freeform mode, use analyzed items or create a single item with the freeform text
        if (freeformAnalysis.items.length > 0) {
          computedItems = freeformAnalysis.items;
          tmpSubtotal = freeformAnalysis.totalAmount;
        } else {
          computedItems = [{
            description: data.freeformItems?.trim() || '',
            quantity: 1,
            unitPrice: 0,
            amount: 0
          }];
          tmpSubtotal = 0;
        }
      } else {
        // For structured mode, use the table items
        computedItems = data.items.map(item => ({
          description: item.description?.trim() || '',
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
        }));
        tmpSubtotal = computedItems.reduce((sum, it) => sum + it.amount, 0);
      }
      
      const taxAmountToSend = (data.taxType === 'percent')
        ? ((parseFloat(data.tax) || 0) / 100) * tmpSubtotal
        : (parseFloat(data.tax) || 0);

      const discountAmountToSend = (data.discountType === 'percent')
        ? ((parseFloat(data.discount) || 0) / 100) * tmpSubtotal
        : (parseFloat(data.discount) || 0);

      // Prefer local payments state (source of truth for UI)
      let paymentsToSend = Array.isArray(payments) ? payments : (Array.isArray(data.payments) ? data.payments : []);
      let amountPaidFromPayments = paymentsToSend.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      // Quotes do not send payments or amountPaid
      if (data.documentType === 'quote') {
        paymentsToSend = [];
        amountPaidFromPayments = 0;
      }

      const formData = {
        // Document type
        documentType: data.documentType || 'invoice',
        // Sender company information
        senderCompanyName: data.senderCompanyName?.trim() || '',
        senderCompanyAddress: data.senderCompanyAddress?.trim() || '',
        senderCompanyPhone: data.senderCompanyPhone ? data.senderCompanyPhone.trim() : '',
        senderCompanyEmail: data.senderCompanyEmail?.trim() || '',
        senderCompanyRegistrationNo: data.senderCompanyRegistrationNo ? data.senderCompanyRegistrationNo.trim() : '',
        senderBankAccount: data.documentType === 'quote' ? '' : (data.senderBankAccount ? data.senderBankAccount.trim() : ''),
        senderBankName: data.documentType === 'quote' ? '' : (data.senderBankName ? data.senderBankName.trim() : ''),
        companyLogo: data.companyLogo || '',
        paymentQRCode: data.documentType === 'quote' ? '' : (data.paymentQRCode || ''),
        // Client information
        clientName: data.clientName?.trim() || '',
        clientCompany: data.clientCompany ? data.clientCompany.trim() : '',
        clientEmail: data.clientEmail?.trim() || '',
        clientAddress: data.clientAddress?.trim() || '',
        clientPhone: data.clientPhone ? data.clientPhone.trim() : '',
        dueDate: data.dueDate,
        items: computedItems,
        freeformItems: data.freeformItems || '',
        tax: parseFloat(taxAmountToSend.toFixed(2)) || 0,
        discount: parseFloat(discountAmountToSend.toFixed(2)) || 0,
        discountType: data.discountType || 'amount',
        amountPaid: data.documentType === 'quote' 
          ? 0 
          : (amountPaidFromPayments > 0 ? amountPaidFromPayments : (parseFloat(data.amountPaid) || 0)),
        payments: paymentsToSend,
        notes: data.notes ? data.notes.trim() : '',
        termsAndConditions: data.termsAndConditions ? data.termsAndConditions.trim() : '',
        status: data.status || 'draft'
      };

      console.log('Processed form data to send:', JSON.stringify(formData, null, 2));

      let response;
      const docTypeName = data.documentType === 'quote' ? 'Sebut Harga' : 'Invois';
      
      if (isEdit) {
        console.log('Updating invoice with ID:', id);
        response = await axios.put(`${API_BASE_URL}/api/invoices/${id}`, formData);
        toast.success(`${docTypeName} berjaya dikemaskini`);
      } else {
        console.log('Creating new invoice...');
        response = await axios.post(`${API_BASE_URL}/api/invoices`, formData);
        // Show the actual generated invoice number
        if (response.data.invoice && response.data.invoice.invoiceNumber) {
          toast.success(`${docTypeName} ${response.data.invoice.invoiceNumber} berjaya dicipta!`, {
            duration: 4000
          });
        } else {
          toast.success(`${docTypeName} berjaya dicipta`);
        }
      }
      
      console.log('Server response:', response.data);
      navigate('/invoices');
    } catch (error) {
      console.error('=== FRONTEND SUBMIT ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error details:', error.response?.data?.errors);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        
        // Show detailed errors if available
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          error.response.data.errors.forEach((err, index) => {
            console.error(`Validation error ${index + 1}:`, err);
            toast.error(`Error ${index + 1}: ${err}`);
          });
        }
      } else {
        const docTypeName = data.documentType === 'quote' ? 'sebut harga' : 'invois';
        toast.error(isEdit ? `Gagal mengemaskini ${docTypeName}` : `Gagal mencipta ${docTypeName}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="rounded-2xl bg-white/70 backdrop-blur p-6 shadow ring-1 ring-gray-200">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gradient-to-br from-primary-50 via-white to-primary-100/60 px-4 py-6 md:py-10">
      {/* Corak latar halus */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#e5e7eb_1px,transparent_1.5px)] [background-size:20px_20px]"></div>
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-200/50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary-300/40 blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit 
              ? `Edit ${watchedDocumentType === 'quote' ? 'Sebut Harga' : 'Invois'}` 
              : `Cipta ${watchedDocumentType === 'quote' ? 'Sebut Harga' : 'Invois'} Baru`
            }
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEdit 
              ? `Kemaskini maklumat ${watchedDocumentType === 'quote' ? 'sebut harga' : 'invois'}` 
              : `Isi maklumat untuk ${watchedDocumentType === 'quote' ? 'sebut harga' : 'invois'} baru`
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Document Type Selection */}
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                <FiFileText className="h-5 w-5" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Jenis Dokumen</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Jenis Dokumen *
                </label>
                <select
                  {...register('documentType', { required: 'Jenis dokumen diperlukan' })}
                  onChange={(e) => {
                    const newDocType = e.target.value;
                    console.log('Select onChange triggered:', newDocType);
                    setValue('documentType', newDocType);
                    setCurrentDocumentType(newDocType);
                    
                    // Update preview number immediately
                    if (isEdit && previewInvoiceNumber) {
                      const parts = previewInvoiceNumber.split('-');
                      if (parts.length >= 2) {
                        const yearMonth = parts[1];
                        const sequence = parts[2] || 'xxx';
                        const newDocPrefix = newDocType === 'quote' ? settings.quotePrefix : settings.invoicePrefix;
                        const newNumber = `${newDocPrefix}-${yearMonth}-${sequence}`;
                        console.log(`Immediate update: ${previewInvoiceNumber} -> ${newNumber}`);
                        setPreviewInvoiceNumber(newNumber);
                      }
                    }

                    // If switching to quote, clear payment-related fields
                    if (newDocType === 'quote') {
                      setPayments([]);
                      setValue('payments', []);
                      setValue('amountPaid', 0);
                      toast.success('Mod Sebut Harga: rekod pembayaran dimatikan');
                      const currentStatus = watch('status');
                      if (currentStatus === 'paid' || currentStatus === 'overdue') {
                        setValue('status', 'draft');
                      }
                      // Clear bank fields in quote mode
                      setValue('senderBankName', '');
                      setValue('senderBankAccount', '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                >
                  <option value="invoice">Invois</option>
                  <option value="quote">Sebut Harga</option>
                </select>
                {errors.documentType && (
                  <p className="mt-1 text-sm text-red-600">{errors.documentType.message}</p>
                )}
              </div>
              
              <div className="flex items-end">
                <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">
                      {watchedDocumentType === 'quote' ? 'Sebut Harga' : 'Invois'}
                    </span>
                    {watchedDocumentType === 'quote' 
                      ? ' - Dokumen untuk memberikan harga kepada pelanggan'
                      : ' - Dokumen untuk menagih pembayaran dari pelanggan'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Logo Section - Moved to Top */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
              <FiImage className="h-5 w-5" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Logo Syarikat</h3>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                PNG, JPG hingga 2MB. Logo akan dipaparkan di bahagian atas invois.
              </p>
            </div>
            
            {(logoPreview || (settings.companyLogo && settings.showCompanyLogo)) && (
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={logoPreview || settings.companyLogo}
                    alt="Logo Preview"
                    className="h-20 w-20 object-contain rounded-lg bg-white/90 p-2 shadow-sm ring-1 ring-gray-200"
                  />
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Sender Information Section */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
              <FiUser className="h-5 w-5" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Maklumat Syarikat Pengirim</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nama Syarikat *
              </label>
              <input
                {...register('senderCompanyName', { 
                  required: 'Nama syarikat diperlukan' 
                })}
                type="text"
                className="mt-1 input"
                placeholder="Nama syarikat pengirim"
              />
              {errors.senderCompanyName && (
                <p className="mt-1 text-sm text-red-600">{errors.senderCompanyName.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Alamat Syarikat *
              </label>
              <textarea
                {...register('senderCompanyAddress', { 
                  required: 'Alamat syarikat diperlukan' 
                })}
                rows={3}
                className="mt-1 input"
                placeholder="Alamat lengkap syarikat"
              />
              {errors.senderCompanyAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.senderCompanyAddress.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Syarikat *
              </label>
              <input
                {...register('senderCompanyEmail', { 
                  required: 'Email syarikat diperlukan',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Format email tidak sah'
                  }
                })}
                type="email"
                className="mt-1 input"
                placeholder="email@syarikat.com"
              />
              {errors.senderCompanyEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.senderCompanyEmail.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefon Syarikat
              </label>
              <input
                {...register('senderCompanyPhone')}
                type="tel"
                className="mt-1 input"
                placeholder="+603-12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                No. Pendaftaran Syarikat
              </label>
              <input
                {...register('senderCompanyRegistrationNo')}
                type="text"
                className="mt-1 input"
                placeholder="Contoh: 123456-A"
              />
            </div>

            {watchedDocumentType !== 'quote' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Bank
                  </label>
                  <input
                    {...register('senderBankName')}
                    type="text"
                    className="mt-1 input"
                    placeholder="Contoh: Maybank"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    No. Akaun Bank
                  </label>
                  <input
                    {...register('senderBankAccount')}
                    type="text"
                    className="mt-1 input"
                    placeholder="Contoh: 123456789012"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kod QR Pembayaran
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      data-purpose="qr"
                      onChange={handleQrUpload}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {qrPreview && (
                      <div className="relative">
                        <img src={qrPreview} alt="QR Pembayaran" className="h-20 w-20 object-contain rounded-lg bg-white/90 p-2 shadow-sm ring-1 ring-gray-200" />
                        <button
                          type="button"
                          onClick={handleRemoveQr}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Muat naik kod QR untuk pembayaran (PNG/JPG, maks 2MB).</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                <FiUser className="h-5 w-5" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Maklumat Pelanggan</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Selection (Modal Trigger) */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Pilih Pelanggan Sedia Ada
                  </label>
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => handleCustomerSelect('')}
                      className="inline-flex items-center text-xs text-gray-600 hover:text-gray-800 underline"
                    >
                      <FiX className="w-3 h-3 mr-1" />
                      Kosongkan pilihan
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowCustomerModal(true); setCustomerSearch(''); fetchCustomers({ limit: 10 }); }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <FiSearch className="w-4 h-4 mr-2" /> Cari Pelanggan
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/customers/new')}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FiUsers className="w-4 h-4 mr-1" /> Tambah Pelanggan
                  </button>
                </div>
                {selectedCustomer && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1 inline-flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Dipilih: {selectedCustomer.name}{selectedCustomer.company ? ` (${selectedCustomer.company})` : ''}
                  </div>
                )}
              </div>

              {/* Baris maklumat pelanggan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Pelanggan *
                </label>
                <input
                  {...register('clientName', { required: 'Nama pelanggan diperlukan' })}
                  type="text"
                  className="mt-1 input"
                  placeholder="Nama pelanggan"
                />
                {errors.clientName ? (
                  <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
                ) : (
                  <div className="h-5" />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Syarikat Pelanggan
                </label>
                <input
                  {...register('clientCompany')}
                  type="text"
                  className="mt-1 input"
                  placeholder="Nama syarikat pelanggan"
                />
                <div className="h-5" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Alamat Pelanggan *
                </label>
                <textarea
                  {...register('clientAddress', { required: 'Alamat pelanggan diperlukan' })}
                  rows={3}
                  className="mt-1 input"
                  placeholder="Alamat lengkap pelanggan"
                />
                {errors.clientAddress ? (
                  <p className="mt-1 text-sm text-red-600">{errors.clientAddress.message}</p>
                ) : (
                  <div className="h-5" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Pelanggan *
                </label>
                <input
                  {...register('clientEmail', { 
                    required: 'Email pelanggan diperlukan',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Format email tidak sah'
                    }
                  })}
                  type="email"
                  className="mt-1 input"
                  placeholder="email@contoh.com"
                />
                {errors.clientEmail ? (
                  <p className="mt-1 text-sm text-red-600">{errors.clientEmail.message}</p>
                ) : (
                  <div className="h-5" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telefon Pelanggan
                </label>
                <input
                  {...register('clientPhone')}
                  type="tel"
                  className="mt-1 input"
                  placeholder="+60123456789"
                />
                <div className="h-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                <FiFileText className="h-5 w-5" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">{watchedDocumentType === 'quote' ? 'Maklumat Sebut Harga' : 'Maklumat Invois'}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  No. {watchedDocumentType === 'quote' ? 'Sebut Harga' : 'Invois'}
                </label>
                <div className="mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  {previewInvoiceNumber ? previewInvoiceNumber : 'Auto-generated'}
                  {!isEdit && <span className="text-xs text-gray-400 ml-2">(akan dijanakan automatik)</span>}
                  {isEdit && originalDocumentType && currentDocumentType !== originalDocumentType && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                      ⚠️ Nombor akan berubah dari {originalDocumentType === 'quote' ? 'QUO' : 'INV'} ke {currentDocumentType === 'quote' ? 'QUO' : 'INV'} apabila disimpan
                    </div>
                  )}
                  {isEdit && originalDocumentType && currentDocumentType === originalDocumentType && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                      ✅ Nombor dokumen akan kekal sama
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tarikh Jatuh Tempo *
                </label>
                <input
                  {...register('dueDate', { required: 'Tarikh jatuh tempo diperlukan' })}
                  type="date"
                  className="mt-1 input"
                />
                {errors.dueDate ? (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                ) : (
                  <div className="h-5" />
                )}
              </div>

              <div className={!isEdit ? 'invisible' : ''} aria-hidden={!isEdit}>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="mt-1 input"
                  disabled={!isEdit}
                >
                  {watchedDocumentType === 'quote' ? (
                    <>
                      <option value="draft">Draf</option>
                      <option value="sent">Dihantar</option>
                    </>
                  ) : (
                    <>
                      <option value="draft">Draf</option>
                      <option value="sent">Dihantar</option>
                      <option value="paid">Dibayar</option>
                      <option value="overdue">Lewat Tempoh</option>
                    </>
                  )}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Diskaun
                </label>
                <div className="mt-1 grid grid-cols-4 gap-3 items-start">
                  <div className="col-span-1">
                    <select
                      {...register('discountType')}
                      className="input"
                    >
                      <option value="amount">RM</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      {...register('discount')}
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      placeholder={watchedDiscountType === 'percent' ? '0.00' : '0.00'}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {watchedDiscountType === 'percent' 
                    ? 'Masukkan peratus diskaun. Nilai RM dikira automatik.' 
                    : 'Masukkan nilai diskaun dalam Ringgit Malaysia.'}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Cukai
                </label>
                <div className="mt-1 grid grid-cols-4 gap-3 items-start">
                  <div className="col-span-1">
                    <select
                      {...register('taxType')}
                      className="input"
                    >
                      <option value="amount">RM</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      {...register('tax')}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder={watchedTaxType === 'percent' ? '0.00' : '0.00'}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {watchedTaxType === 'percent' 
                    ? 'Masukkan peratus cukai. Nilai RM dikira automatik.' 
                    : 'Masukkan nilai cukai dalam Ringgit Malaysia.'}
                </p>
              </div>

              {watchedDocumentType !== 'quote' ? (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Rekod Pembayaran
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FiPlus className="w-3 h-3 mr-1" />
                    Tambah Pembayaran
                  </button>
                </div>
                
                {payments.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {payments.map((payment, index) => (
                      <div key={payment._id || payment.id || index} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              RM {parseFloat(payment.amount || 0).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {payment.date ? new Date(payment.date).toLocaleDateString('ms-MY') : 'Hari ini'}
                            </span>
                          </div>
                          {payment.note && (
                            <p className="text-xs text-gray-600 mt-1">{payment.note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditPayment(payment, index)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit pembayaran"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(index)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Hapus pembayaran"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FiDollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Tiada pembayaran direkodkan</p>
                    <p className="text-xs text-gray-400 mt-1">Klik "Tambah Pembayaran" untuk mula merekod</p>
                    {parseFloat(watchedAmountPaid) > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-700 mb-2">
                          💡 Ditemui pembayaran lama: RM {parseFloat(watchedAmountPaid).toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const legacyPayment = {
                              amount: parseFloat(watchedAmountPaid),
                              date: new Date().toISOString().split('T')[0],
                              note: 'Pembayaran sedia ada (dipindahkan)'
                            };
                            const newPayments = [legacyPayment];
                            setPayments(newPayments);
                            setValue('payments', newPayments);
                            setValue('amountPaid', 0); // Clear old amount
                            toast.success('Pembayaran lama telah dipindahkan ke sistem baru');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Pindahkan ke sistem pembayaran baru
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  Rekod setiap pembayaran yang diterima dengan nota untuk rujukan
                </p>
              </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pembayaran (Dimatikan untuk Sebut Harga)
                  </label>
                  <div className="p-4 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg">
                    Dokumen ini adalah Sebut Harga. Tiada pembayaran direkodkan pada peringkat ini.
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nota Tambahan
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="mt-1 input"
                  placeholder="Nota atau komen tambahan"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                <FiList className="h-5 w-5" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">{watchedDocumentType === 'quote' ? 'Item Sebut Harga' : 'Item Invois'}</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mod:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setItemsMode('structured');
                      // Clear any existing validation errors when switching modes
                      if (errors.freeformItems) {
                        delete errors.freeformItems;
                      }
                      // Clear freeform analysis when switching to structured mode
                      setFreeformAnalysis({ totalAmount: 0, items: [] });
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      itemsMode === 'structured'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Jadual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemsMode('freeform');
                      // Clear any existing validation errors when switching modes
                      if (errors.items) {
                        // Clear items validation errors
                        Object.keys(errors.items).forEach(key => {
                          if (errors.items[key]) {
                            delete errors.items[key];
                          }
                        });
                      }
                      // Clear structured items when switching to freeform mode
                      // Keep only the first item as a fallback
                      const currentItems = watch('items');
                      if (currentItems && currentItems.length > 0) {
                        setValue('items', [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      itemsMode === 'freeform'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Teks Bebas
                  </button>
                </div>
              </div>
              
              {itemsMode === 'structured' && (
                <button
                  type="button"
                  onClick={() => append({ description: '', quantity: 1, unitPrice: 0, amount: 0 })}
                  className="inline-flex items-center btn-secondary"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Tambah Item
                </button>
              )}
            </div>
          </div>

          {modeDetectionComplete && itemsMode === 'structured' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full rounded-lg overflow-hidden ring-1 ring-gray-200">
                <thead>
                  <tr className="bg-primary-50 border-b border-gray-200">
                    <th className="text-left py-2.5 px-3 text-sm font-medium text-gray-700">Penerangan</th>
                    <th className="text-left py-2.5 px-3 text-sm font-medium text-gray-700 w-24">Kuantiti</th>
                    <th className="text-left py-2.5 px-3 text-sm font-medium text-gray-700 w-36">Harga Unit (RM)</th>
                    <th className="text-left py-2.5 px-3 text-sm font-medium text-gray-700 w-36">Jumlah (RM)</th>
                    <th className="text-center py-2.5 px-3 text-sm font-medium text-gray-700 w-24">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-b border-gray-100">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100 text-xs font-semibold">
                            {index + 1}
                          </div>
                          <input
                            {...register(`items.${index}.description`, { 
                              required: itemsMode === 'structured' ? 'Penerangan diperlukan' : false
                            })}
                            type="text"
                            className="w-full input"
                            placeholder="Penerangan item"
                          />
                        </div>
                        {errors.items?.[index]?.description && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors.items[index].description.message}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 w-24">
                        <input
                          {...register(`items.${index}.quantity`, { 
                            required: itemsMode === 'structured' ? 'Kuantiti diperlukan' : false,
                            min: itemsMode === 'structured' ? { value: 0.01, message: 'Kuantiti mesti lebih daripada 0' } : false,
                            valueAsNumber: true
                          })}
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-right"
                          placeholder="1"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors.items[index].quantity.message}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 w-36">
                        <input
                          {...register(`items.${index}.unitPrice`, { 
                            required: itemsMode === 'structured' ? 'Harga unit diperlukan' : false,
                            min: itemsMode === 'structured' ? { value: 0, message: 'Harga unit tidak boleh negatif' } : false,
                            valueAsNumber: true
                          })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-right"
                          placeholder="0.00"
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors.items[index].unitPrice.message}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 w-36">
                        <input
                          {...register(`items.${index}.amount`)}
                          type="number"
                          step="0.01"
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center w-24">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 shadow-sm hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
                            title="Hapus item"
                          >
                            <FiTrash2 className="h-4 w-4" />
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : modeDetectionComplete && itemsMode === 'freeform' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {watchedDocumentType === 'quote' ? 'Penerangan Item Sebut Harga' : 'Penerangan Item Invois'}
                </label>
                <textarea
                  {...register('freeformItems', { 
                    required: itemsMode === 'freeform' ? 'Penerangan item diperlukan' : false 
                  })}
                  rows={8}
                  className="w-full input text-sm leading-relaxed"
                  placeholder={`Masukkan ${watchedDocumentType === 'quote' ? 'item sebut harga' : 'item invois'} dengan bebas. Contoh:

• Konsultasi IT - RM 500.00
• 2x Pembangunan website - RM 1000.00  
• 5 pcs Penyelenggaraan - RM 300.00
• Setup server - RM 200.00

Format yang disokong:
- "Item - RM 100.00"
- "2x Item - RM 50.00" 
- "5 pcs Item - RM 20.00"
- "3 unit Item - RM 30.00"`}
                />
                {errors.freeformItems && (
                  <p className="mt-1 text-sm text-red-600">{errors.freeformItems.message}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  💡 Mod teks bebas membolehkan anda menaip item dengan format yang fleksibel. 
                  Sistem akan mengesan harga (RM) dan kuantiti secara automatik.
                </p>
                
                {/* Show analysis results */}
                {freeformAnalysis.items.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Analisis Automatik:</h4>
                    <div className="space-y-1 text-xs text-blue-800">
                      {freeformAnalysis.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="truncate flex-1 mr-2">{item.description}</span>
                          {item.amount > 0 && (
                            <span className="font-medium">RM {item.amount.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                      {freeformAnalysis.totalAmount > 0 && (
                        <div className="border-t border-blue-300 pt-1 mt-2 flex justify-between font-medium">
                          <span>Jumlah Dikesan:</span>
                          <span>RM {freeformAnalysis.totalAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Loading state while mode detection is in progress
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-gray-500">Memuat data item...</div>
            </div>
          )}

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-2 rounded-xl bg-white/70 backdrop-blur p-4 ring-1 ring-gray-200 shadow-sm">
                {modeDetectionComplete && itemsMode === 'structured' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">RM {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {(parseFloat(watchedDiscount) || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {watchedDiscountType === 'percent' 
                            ? `Diskaun (${(parseFloat(watchedDiscount) || 0).toFixed(2)}%)` 
                            : 'Diskaun'}:
                        </span>
                        <span className="text-sm font-medium text-red-600">-RM {calculateDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {watchedTaxType === 'percent' 
                          ? `Cukai (${(parseFloat(watchedTax) || 0).toFixed(2)}%)` 
                          : 'Cukai'}:
                      </span>
                      <span className="text-sm font-medium">RM {calculateTaxAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-base font-medium">Jumlah:</span>
                      <span className="text-base font-bold">RM {calculateTotal().toFixed(2)}</span>
                    </div>
                  </>
                ) : modeDetectionComplete && itemsMode === 'freeform' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal (Dikesan):</span>
                      <span className="text-sm font-medium">RM {freeformAnalysis.totalAmount.toFixed(2)}</span>
                    </div>
                    {(parseFloat(watchedDiscount) || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {watchedDiscountType === 'percent' 
                            ? `Diskaun (${(parseFloat(watchedDiscount) || 0).toFixed(2)}%)` 
                            : 'Diskaun'}:
                        </span>
                        <span className="text-sm font-medium text-red-600">-RM {calculateDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {watchedTaxType === 'percent' 
                          ? `Cukai (${(parseFloat(watchedTax) || 0).toFixed(2)}%)` 
                          : 'Cukai'}:
                      </span>
                      <span className="text-sm font-medium">RM {calculateTaxAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-base font-medium">Jumlah:</span>
                      <span className="text-base font-bold">RM {calculateTotal().toFixed(2)}</span>
                    </div>
                    {freeformAnalysis.totalAmount === 0 && (
                      <div className="text-center py-2">
                        <div className="text-xs text-gray-400">
                          💡 Tulis harga dengan format: "Item - RM 100.00" atau "2x Item - RM 50.00"
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Loading state for calculations
                  <div className="text-center py-4">
                    <div className="animate-pulse text-gray-400">Mengira...</div>
                  </div>
                )}
                {watchedDocumentType !== 'quote' && modeDetectionComplete && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bayaran Diterima:</span>
                      <span className="text-sm font-medium text-green-600">RM {calculateTotalPaid().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-base font-medium">
                        {calculateOutstandingAmount() > 0 ? 'Baki Tertunggak:' : 'Status:'}
                      </span>
                      <span className={`text-base font-bold ${
                        calculateOutstandingAmount() === 0 
                          ? 'text-green-600' 
                          : calculateOutstandingAmount() > 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                      }`}>
                        {calculateOutstandingAmount() === 0 
                          ? 'LUNAS' 
                          : `RM ${calculateOutstandingAmount().toFixed(2)}`
                        }
                      </span>
                    </div>
                    {calculateOutstandingAmount() > 0 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-700">
                          💡 Pelanggan masih berhutang RM {calculateOutstandingAmount().toFixed(2)}
                        </p>
                      </div>
                    )}
                    {calculateOutstandingAmount() === 0 && calculateTotalPaid() > 0 && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-xs text-green-700">
                          ✅ Pembayaran telah lengkap
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Section */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg ring-1 ring-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
              <FiShield className="h-5 w-5" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">{watchedDocumentType === 'quote' ? 'Terma dan Syarat Sebut Harga' : 'Terma dan Syarat Invois'}</h3>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {watchedDocumentType === 'quote' ? 'Terma dan Syarat Sebut Harga' : 'Terma dan Syarat Invois'}
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
              <input
                value={aiBrief}
                onChange={(e) => setAiBrief(e.target.value)}
                placeholder="Ringkasan/keperluan (pilihan) untuk bantu AI"
                className="input md:col-span-4 text-sm"
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={async () => {
                  try {
                    setAiLoading(true);
                    
                    // Debug: Check document type
                    console.log('Document type:', watchedDocumentType);
                    const docType = watchedDocumentType || 'invoice'; // Fallback to invoice
                    const businessType = docType === 'quote' ? 'Sebut Harga' : 'Invois';
                    console.log('Business type:', businessType);
                    
                    const requestData = {
                      businessType: businessType,
                      language: 'malay',
                      notes: aiBrief || ''
                    };
                    
                    console.log('Request data:', requestData);
                    
                    const resp = await axios.post(`${API_BASE_URL}/api/ai/generate-terms`, requestData);
                    if (resp.data?.terms) {
                      setValue('termsAndConditions', resp.data.terms);
                      toast.success('Terma dan Syarat dijana');
                    } else {
                      toast.error('Gagal menjana Terma dan Syarat');
                    }
                  } catch (err) {
                    console.error('AI Terms Error:', err);
                    console.error('Error response:', err?.response?.data);
                    toast.error(err?.response?.data?.message || 'Ralat AI: gagal menjana');
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-white ${aiLoading ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
              >
                {aiLoading ? 'Menjana…' : 'Jana dengan AI'}
              </button>
              <button
                type="button"
                disabled={aiShortLoading}
                onClick={async () => {
                  try {
                    setAiShortLoading(true);
                    
                    // Debug: Check document type
                    console.log('Document type (short):', watchedDocumentType);
                    const docType = watchedDocumentType || 'invoice'; // Fallback to invoice
                    const businessType = docType === 'quote' ? 'Sebut Harga' : 'Invois';
                    console.log('Business type (short):', businessType);
                    
                    const requestData = {
                      businessType: businessType,
                      language: 'malay',
                      notes: aiBrief ? `${aiBrief} (ringkaskan lagi, lebih padat)` : 'Ringkaskan lagi, lebih padat'
                    };
                    
                    console.log('Request data (short):', requestData);
                    
                    const resp = await axios.post(`${API_BASE_URL}/api/ai/generate-terms`, requestData);
                    if (resp.data?.terms) {
                      setValue('termsAndConditions', resp.data.terms);
                      toast.success('Diringkaskan (1–3 baris)');
                    } else {
                      toast.error('Gagal ringkaskan Terma dan Syarat');
                    }
                  } catch (err) {
                    console.error('AI Terms Short Error:', err);
                    console.error('Error response (short):', err?.response?.data);
                    toast.error(err?.response?.data?.message || 'Ralat AI: gagal ringkaskan');
                  } finally {
                    setAiShortLoading(false);
                  }
                }}
                className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-white ${aiShortLoading ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {aiShortLoading ? 'Merumus…' : 'Ringkas lagi'}
              </button>
            </div>
            <textarea
              {...register('termsAndConditions')}
              rows={4}
              className="input text-sm leading-tight max-h-40 overflow-auto resize-y"
              placeholder={watchedDocumentType === 'quote' 
                ? 'Masukkan terma dan syarat untuk sebut harga ini. Jika kosong, terma standard akan digunakan.'
                : 'Masukkan terma dan syarat untuk invois ini. Jika kosong, terma standard akan digunakan.'}
              defaultValue={DEFAULT_TERMS}
            />
            <p className="mt-2 text-sm text-gray-500">
              {watchedDocumentType === 'quote' 
                ? 'Terma dan syarat ini akan dipaparkan di bahagian bawah sebut harga. Anda boleh mengubahnya mengikut keperluan.'
                : 'Terma dan syarat ini akan dipaparkan di bahagian bawah invois. Anda boleh mengubahnya mengikut keperluan.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center btn-secondary"
          >
            <FiX className="w-4 h-4 mr-2" />
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center btn-primary"
          >
            <FiSave className="w-4 h-4 mr-2" />
            {loading ? 'Menyimpan...' : isEdit ? `Kemaskini ${watchedDocumentType === 'quote' ? 'Sebut Harga' : 'Invois'}` : `Simpan ${watchedDocumentType === 'quote' ? 'Sebut Harga' : 'Invois'}`}
          </button>
        </div>
        </form>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && watchedDocumentType !== 'quote' && (
        <PaymentModal
          payment={editingPayment}
          onSave={handleSavePayment}
          onClose={() => {
            setShowPaymentModal(false);
            setEditingPayment(null);
          }}
          totalAmount={calculateTotal()}
        />
      )}

      {/* Customer Search Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50" onClick={() => setShowCustomerModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl ring-1 ring-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h4 className="text-base md:text-lg font-semibold text-gray-900">Cari Pelanggan</h4>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Tutup"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); fetchCustomers({ search: e.target.value, limit: 10 }); }}
                    placeholder="Cari nama, email, syarikat atau telefon..."
                    className="input pl-9"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchCustomers({ search: customerSearch, limit: 10 })}
                  className="inline-flex items-center btn-secondary"
                >
                  <FiSearch className="w-4 h-4 mr-2" />
                  Cari
                </button>
              </div>

              <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-gray-100 rounded-lg ring-1 ring-gray-200">
                {customers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Tiada pelanggan ditemui</div>
                ) : (
                  customers.map((c) => (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() => { handleCustomerSelect(c._id); setShowCustomerModal(false); }}
                      className="w-full text-left p-3 hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{c.name}{c.company ? ` (${c.company})` : ''}</div>
                          <div className="text-xs text-gray-600">{c.email}{c.phone ? ` • ${c.phone}` : ''}</div>
                        </div>
                        <div className="text-xs text-gray-500">Pilih</div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">Tidak jumpa? Tambah pelanggan baharu.</p>
                <button
                  type="button"
                  onClick={() => { setShowCustomerModal(false); navigate('/customers/new'); }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiUsers className="w-4 h-4 mr-1" /> Tambah Pelanggan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ payment, onSave, onClose, totalAmount }) => {
  const [formData, setFormData] = useState({
    amount: payment?.amount || '',
    date: payment?.date || new Date().toISOString().split('T')[0],
    note: payment?.note || ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Jumlah pembayaran diperlukan dan mesti lebih daripada 0';
    } else if (parseFloat(formData.amount) > totalAmount) {
      newErrors.amount = 'Jumlah pembayaran tidak boleh melebihi jumlah total';
    }

    if (!formData.date) {
      newErrors.date = 'Tarikh pembayaran diperlukan';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      amount: parseFloat(formData.amount),
      date: formData.date,
      note: formData.note.trim()
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md ring-1 ring-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <FiDollarSign className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {payment ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Pembayaran (RM) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={totalAmount}
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maksimum: RM {totalAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarikh Pembayaran *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 ${
                errors.date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota Pembayaran
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
              placeholder="Contoh: Deposit 50%, Bayaran ansuran bulan 1, Bayaran tunai, dll."
            />
            <p className="mt-1 text-xs text-gray-500">
              Nota untuk rujukan (pilihan)
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <FiX className="w-4 h-4 mr-2" />
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <FiSave className="w-4 h-4 mr-2" />
              {payment ? 'Kemaskini' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
